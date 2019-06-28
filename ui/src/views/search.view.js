import React from 'react';
import { t } from 'ttag';
import { withRouter } from 'react-router-dom';
import QuestionRow from '../components/questions/questionrow';
import Loader from '../components/utils/loader';
import Button from '../components/forms/button';
import InputField from '../components/forms/inputfield';
import * as Question from '../models/question';

class SearchView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            questions: [],
            searchStr: '',
            loadingSearch: false,
            searchResult: [],
            searched: false
        };
    }

    handleChange(node) {
        const value = node.target.value;
        clearTimeout(this.searchTimer);

        const name = node.target.name;
        this.setState({
            [name]: value,
            searched: false
        });

        if (value === '') {
            this.setState({
                searchResult: []
            });
            return;
        }
        this.searchTimer = setTimeout(() => {
            this.fetchSearch();
            this.setState({
                loadingSearch: true,
                searched: true
            });
        }, 700);
    }

    fetchSearch() {
        Question.searchQuestions(this.state.searchStr).then((questions) => {
            this.setState({
                searchResult: questions,
                loadingSearch: false
            });
        });
    }

    renderQuestionRows() {
        return this.state.questions.map((question, index) => {
            return <QuestionRow key={index} question={question} />;
        });
    }

    renderSearchResult() {
        if (this.state.loadingSearch) {
            return <div className="padded-vertical"><Loader /></div>;
        }

        if (this.state.searchResult.length <= 0 && this.state.searchStr.length > 0 && this.state.searched) {
            return <div className="padded-bottom-large">
                {t`No questions found.`}
            </div>;
        }

        if (this.state.searchResult.length <= 0) {
            return null;
        }

        const searchResult = this.state.searchResult.map((question, index) => {
            return <QuestionRow small key={index} question={question} />;
        });
        return (
            <div className="padded-bottom-large">
                <h2>{t`Search result`}</h2>
                {searchResult}
            </div>
        )
    }

    navigate(url) {
        this.props.history.push(url);
    }

    render() {
        return (
            <div>
                <div className="padded-bottom">
                    <InputField
                        label={t`Search questions`}
                        onChange={this.handleChange.bind(this)}
                        name="searchStr"
                        value={this.state.searchStr}
                        autocomplete="off"
                        rounded
                        icon="fa-search"
                    />
                </div>
                {this.renderSearchResult()}
            </div>
        );
    }
}

export default withRouter(SearchView);
