package impl;

import api.Question;
import api.QuestionResource;
import api.auth.Auth;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import dao.QuestionDao;
import io.netty.handler.codec.http.HttpResponseStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import rx.Observable;
import se.fortnox.reactivewizard.jaxrs.WebException;

import java.util.List;

import static com.google.common.base.Strings.isNullOrEmpty;
import static java.util.Collections.emptyList;
import static rx.Observable.error;
import static rx.Observable.just;
import static se.fortnox.reactivewizard.util.rx.RxUtils.exception;

@Singleton
public class QuestionResourceImpl implements QuestionResource {

    private static final Logger LOG = LoggerFactory.getLogger(QuestionResourceImpl.class);
    public static final String FAILED_TO_SEARCH_FOR_QUESTIONS = "failed.to.search.for.questions";
    private final QuestionDao questionDao;

    @Inject
    public QuestionResourceImpl(QuestionDao questionDao) {
        this.questionDao = questionDao;
    }

    @Override
    public Observable<Void> upVoteQuestion(String threadId) {
        return questionDao.upVoteQuestion(threadId)
            .doOnError(throwable -> LOG.error("query failed", throwable));
    }

    @Override
    public Observable<Void> downVoteQuestion(String threadId) {
        return questionDao.downVoteQuestion(threadId)
            .doOnError(throwable -> LOG.error("query failed", throwable));
    }

    @Override
    public Observable<Question> getQuestionBySlackThreadId(String slackThreadId) {
        return this.questionDao.getQuestionBySlackThreadId(slackThreadId).switchIfEmpty(
            exception(() -> new WebException(HttpResponseStatus.NOT_FOUND, "not.found")));
    }

	@Override
	public Observable<Question> getQuestionById(long questionId) {
      return this.questionDao.getQuestionById(questionId).switchIfEmpty(
        exception(() -> new WebException(HttpResponseStatus.NOT_FOUND, "not.found")));
	}

    @Override
    public Observable<List<Question>> getLatestQuestion(Integer limit) {
        if (limit == null) {
            limit = 10;
        }
        return this.questionDao.getLatestQuestions(limit).toList().onErrorResumeNext(e ->
            error(new WebException(HttpResponseStatus.INTERNAL_SERVER_ERROR, "failed.to.get.latest.questions", e))
        );
    }

    @Override
    public Observable<Question> createQuestion(Auth auth, Question question) {
        return this.questionDao
          .addQuestion(auth.getUserId(), question)
            .map(longGeneratedKey -> {
                question.setId(longGeneratedKey.getKey());
                return question;
            })
          .onErrorResumeNext(throwable -> error(new WebException(HttpResponseStatus.INTERNAL_SERVER_ERROR, "failed.to.add.question.to.database", throwable)));
    }

    @Override
    public Observable<List<Question>> getQuestionsBySearchQuery(String searchQuery, Integer limit) {
        if (limit == null) {
            limit = 50;
        }
        if (isNullOrEmpty(searchQuery)) {
            return just(emptyList());
        }
        return questionDao.getQuestions(searchQuery, limit)
            .onErrorResumeNext(e -> {
                LOG.error("failed to search for questions with search query: [" + searchQuery + "]");
                return error(new WebException(HttpResponseStatus.INTERNAL_SERVER_ERROR, FAILED_TO_SEARCH_FOR_QUESTIONS ,e));
            }).toList();
    }
}
