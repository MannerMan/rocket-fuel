import React from 'react';
import { withRouter } from 'react-router-dom';
import Markdown from '../helpers/markdown';
import moment from 'moment';
import Certificate from '../utils/certificate';
import * as Question from '../../models/question';
import * as Answer from '../../models/answer';
import Button from '../forms/button';
import { UserContext } from '../../usercontext';
import Trophy from '../utils/trophy';
import { t } from 'ttag';
import Dialog from '../utils/dialog';
import InputField from '../forms/inputfield';

class Post extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isDeleteDialogOpen: false,
            isEditDialogOpen: false,
            currentBody: '',
            postingToServer: false
        };
    }

    componentDidMount() {
        this.setState({
            votes: this.props.votes
        });
    }

    getClasses() {
        let classes = `question-post ${this.props.className}`;
        if (this.props.answered) {
            classes = `${classes} accepted`;
        }
        if (this.props.votes < -3) {
            classes = `${classes} faded`;
        }
        return classes;
    }

    renderAccepted() {
        if (!this.props.answerId) {
            return;
        }

        if (!this.props.enableAccept) {
            return null;
        }

        if (!this.props.accepted) {
            return (
                <div className="unaccepted">
                    <i className="fa fa-check"
                       onClick={() => this.props.onAnswer(this.props.answerId)} />
                </div>
            );
        }

        return (
            <div className="accepted">
                <i className="fa fa-check" />
            </div>
        );
    }

    getTime() {
        return moment(this.props.created).fromNow();
    }

    renderAnswered() {
        return (
            <Certificate active={this.props.answered} />
        );
    }

    renderAwarded() {
        const isTrophyActive = this.state.votes >= 20;
        return <Trophy active={isTrophyActive} />;
    }

    onChangeAnswer(e) {
        const value = e.target.value;
        this.setState({
            answer: value
        });
    }

    closeEditDialog() {
        this.setState({
            isEditDialogOpen: false
        });
    }

    openDeleteDialog() {
        this.setState({
            isDeleteDialogOpen: true
        });
    }

    closeDeleteDialog() {
        this.setState({
            isDeleteDialogOpen: false
        });
    }

    getDialogTitle() {
        if (!this.props.questionId) {
            return t`Delete answer`;
        }

        return t`Delete question`;
    }

    getDialogBody() {
        let prefix = <b>{this.props.title}</b>;
        if (!this.props.questionId) {
            prefix = t`The answer`;
        }

        return <>{prefix} {t`will be deleted from Rocket fuel.`}</>;
    }

    editPost() {
        if (!this.props.questionId) {
            this.setState({
                answer: this.props.body,
                isEditDialogOpen: true
            });
            return;
        }
        this.props.history.push(`/create/question/${this.props.questionId}`);
    }

    saveAnswer() {
        if (!this.props.answerId) {
            return;
        }
        this.setState({
            postingToServer: true
        });
        Answer.updateAnswer(this.props.answerId, {answer: this.state.answer})
            .then(() => {
                this.setState({
                    isEditDialogOpen: false,
                    currentBody: this.state.answer,
                    postingToServer: false
                });
                this.props.onEdit();
            }).catch(() => {
            this.setState({
                postingToServer: false
            });
        });
    }

    delete() {
        if (!this.props.questionId) {
            Answer.deleteAnswer(this.props.answerId).then(() => {
                this.setState({
                    isDeleteDialogOpen: false
                });
                this.props.onDelete();
            });
            return;
        }
        Question.deleteQuestion(this.props.questionId).then(() => {
            this.setState({
                isDeleteDialogOpen: false
            });
            this.props.onDelete();
            this.props.history.replace('/');
        });
    }

    renderVotes() {

        if(!this.props.enableVote) {
            return null;
        }

        return (
            <>
                {this.renderUpVote()}
                <div>
                    {this.props.votes}
                </div>
                {this.renderDownVote()}
            </>
        );
    }

    renderUpVote() {
        return this.renderVote(this.props.allowUpVote, this.props.onUpVote, 'fa-caret-up');
    }

    renderDownVote() {
        return this.renderVote(this.props.allowDownVote, this.props.onDownVote, 'fa-caret-down');
    }

    renderVote(isVoteAllowed, onVote, faClass) {
        return (
            <div className={`vote${isVoteAllowed ? '' : '-disabled'}`}>
                <i onClick={() => `${isVoteAllowed ? onVote(this.props.answerId) : ''}`} className={'fa ' + faClass}/>
            </div>
        )
    }

    renderButtons() {
        if (this.props.userId !== this.context.state.user.id) {
            return null;
        }

        return (
            <div className="button-group">
                <Button color="secondary" text small onClick={this.editPost.bind(this)}>
                    <i className="fa fa-pencil" /> {t`Edit`}
                </Button>
                <Button color="secondary" text small onClick={this.openDeleteDialog.bind(this)}>
                    <i className="fa fa-trash" /> {t`Delete`}
                </Button>
            </div>
        );
    }

    renderDeleteDialog() {
        return (
            <Dialog isOpen={this.state.isDeleteDialogOpen} title={this.getDialogTitle()}>
                <div className="padded-bottom-large">
                    {this.getDialogBody()}
                </div>
                <div className="flex flex-end">
                    <Button onClick={this.closeDeleteDialog.bind(this)} text>{t`Cancel`}</Button>
                    <Button onClick={this.delete.bind(this)} text color="primary">{t`Delete`}</Button>
                </div>
            </Dialog>
        );
    }

    renderEditDialog() {
        return (
            <Dialog isOpen={this.state.isEditDialogOpen} title={t`Edit answer`}>
                <div className="padded-bottom-large">
                    <InputField
                        type="textarea"
                        name="answer"
                        value={this.state.answer}
                        onChange={this.onChangeAnswer.bind(this)}
                        label={t`Answer`}
                        markdown
                    />
                </div>
                <div className="flex flex-end">
                    <Button onClick={this.closeEditDialog.bind(this)} text>{t`Cancel`}</Button>
                    <Button onClick={this.saveAnswer.bind(this)} loading={this.state.postingToServer} text color="primary">{t`Save`}</Button>
                </div>
            </Dialog>
        );
    }

    render() {
        return (
            <div id={this.getId()} className={this.getClasses()}>
                {this.renderDeleteDialog()}
                {this.renderEditDialog()}
                <div className="post-sidebar">
                    {this.renderVotes()}
                    {this.renderAccepted()}
                    {this.renderAnswered()}
                    {this.renderAwarded()}
                </div>
                <div className="flex-grow">
                    <div className="post-body">
                        <h3>{this.props.title}</h3>
                        <div className="padded-bottom">
                            <Markdown text={this.props.body} />
                        </div>
                    </div>
                    <div className="post-footer flex flex-between">
                        <div className="center-vertical">
                            <div className="picture">
                                <img src={this.props.picture} alt={this.props.userName}/>
                            </div>
                            <div>
                                <div><i className="fa fa-user" /> {this.props.userName}</div>
                                <div><i className="fa fa-clock-o" /> {this.getTime()}</div>
                            </div>
                        </div>
                        {this.renderButtons()}
                    </div>
                </div>
            </div>
        );
    }

    getId() {
        return this.props.questionId ? `question_${this.props.questionId}` : `answer_${this.props.answerId}`;
    }
}

Post.defaultProps = {
    className: '',
    body: '',
    title: null,
    userName: '',
    userId: 0,
    created: new Date(),
    votes: 0,
    currentUserVote: 0,
    answered: false,
    questionId: null,
    answerId: null,
    picture: null,
    onDelete: () => {},
    onEdit: () => {},
    enableAccept: false,
    enableVote: false,
    onUpVote: () => {},
    onDownVote: () => {},
    allowUpVote: false,
    allowDownVote: false
};

export default withRouter(Post);

Post.contextType = UserContext;
