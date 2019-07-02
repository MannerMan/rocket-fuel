package impl;

import api.Answer;
import api.AnswerResource;
import api.Question;
import api.UserResource;
import api.auth.Auth;
import com.github.seratch.jslack.api.model.block.LayoutBlock;
import com.github.seratch.jslack.api.model.block.SectionBlock;
import com.github.seratch.jslack.api.model.block.composition.MarkdownTextObject;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import dao.AnswerDao;
import dao.QuestionDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import rx.Observable;
import se.fortnox.reactivewizard.db.transactions.DaoTransactions;
import se.fortnox.reactivewizard.jaxrs.WebException;
import slack.SlackResource;

import java.util.List;
import java.util.Objects;

import static io.netty.handler.codec.http.HttpResponseStatus.BAD_REQUEST;
import static io.netty.handler.codec.http.HttpResponseStatus.INTERNAL_SERVER_ERROR;
import static java.util.Arrays.asList;
import static rx.Observable.empty;
import static rx.Observable.error;
import static se.fortnox.reactivewizard.util.rx.RxUtils.exception;
import static se.fortnox.reactivewizard.util.rx.RxUtils.first;

@Singleton
public class AnswerResourceImpl implements AnswerResource {

    public static final String ERROR_NOT_OWNER_OF_QUESTION = "not.owner.of.question";
    public static final String ERROR_ANSWER_NOT_CREATED = "answer.not.created";

    private static final Logger LOG = LoggerFactory.getLogger(AnswerResourceImpl.class);

    private final AnswerDao         answerDao;
    private final QuestionDao       questionDao;
    private final DaoTransactions   daoTransactions;
    private final SlackResource     slackResource;
    private final UserResource      userResource;
    private final ApplicationConfig applicationConfig;

    @Inject
    public AnswerResourceImpl(AnswerDao answerDao,
        QuestionDao questionDao,
        DaoTransactions daoTransactions,
        SlackResource slackResource,
        UserResource userResource,
        ApplicationConfig applicationConfig
    ) {
        this.answerDao = answerDao;
        this.questionDao = questionDao;
        this.daoTransactions = daoTransactions;
        this.slackResource = slackResource;
        this.userResource = userResource;
        this.applicationConfig = applicationConfig;
    }

    @Override
    public Observable<Answer> answerQuestion(Auth auth, Answer answer, long questionId) {
        Objects.requireNonNull(answer.getAnswer());

        return this.answerDao.createAnswer(auth.getUserId(), questionId, answer)
            .flatMap(generatedKey -> {
                answer.setId(generatedKey.getKey());
                return first(notifyQuestionOwner(answer, questionId)).thenReturn(answer);
            }).onErrorResumeNext(throwable ->
                error(new WebException(INTERNAL_SERVER_ERROR, ERROR_ANSWER_NOT_CREATED, throwable)));
    }

    private Observable<Void> notifyQuestionOwner(Answer answer, long questionId) {
        return questionDao.getQuestionById(questionId)
            .flatMap(question ->
                userResource.getUserById(question.getUserId())
                    .flatMap(user -> slackResource.getUserId(user.getEmail()))
                    .flatMap(slackUserId ->
                        slackResource.postMessageToSlackAsBotUser(slackUserId, notificationMessage(answer, question))))
            .onErrorResumeNext(throwable -> {
                LOG.warn("Could not notify question owner", throwable);
                return empty();
        });
    }

    private List<LayoutBlock> notificationMessage(Answer answer, Question question) {
        return asList(SectionBlock.builder()
            .text(markdownText("Your question: *%s* got an answer:", question.getTitle()))
            .build(),
            SectionBlock.builder()
                .text(markdownText(answer.getAnswer()))
                .build(),
            SectionBlock.builder()
                .text(markdownText("Head over to <%s|rocket-fuel> to accept the answer", answerUrl(question.getId(), answer.getId())))
                .build());
    }

    private static MarkdownTextObject markdownText(String string, String... args) {
        return MarkdownTextObject.builder()
            .text(String.format(string, args))
            .build();
    }

    private String answerUrl(Long questionId, Long answerId) {
        return applicationConfig.getBaseUrl() + "/question/" + questionId + "#answer_" + answerId;
    }

    @Override
    public Observable<List<Answer>> getAnswers(long questionId) {
        return answerDao.getAnswers(questionId).toList().doOnError(throwable -> {
            System.out.println(throwable.getMessage());
            LOG.error("Failed to get answers for question: " + questionId, throwable);
        });
    }

    @Override
    public Observable<Answer> getAnswerBySlackId(String slackId) {
        return answerDao.getAnswer(slackId);
    }

    @Override
    public Observable<Void> upVoteAnswer(String threadId) {
        return answerDao.upVoteAnswer(threadId);
    }

    public Observable<Void> downVoteAnswer(String threadId) {
        return answerDao.downVoteAnswer(threadId);
    }

    @Override
    public Observable<Void> markAsAcceptedAnswer(Auth auth, long answerId) {
        return answerDao.getAnswerById(answerId)
            .flatMap(answer -> {
                if (answer.getQuestion().getUserId() != auth.getUserId()) {
                    return exception(() -> new WebException(BAD_REQUEST, ERROR_NOT_OWNER_OF_QUESTION));
                }
                Observable<Integer> markAnswerAsAccepted   = answerDao.markAsAccepted(answerId);
                Observable<Integer> markQuestionAsAnswered = questionDao.markAsAnswered(auth.getUserId(), answer.getQuestionId());
                return daoTransactions.executeTransaction(markAnswerAsAccepted, markQuestionAsAnswered);
            });
    }
}
