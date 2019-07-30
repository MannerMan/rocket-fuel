import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-autosize-textarea';
import { t } from 'ttag';

class InputField extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            active: false
        };
    }

    componentWillMount() {
        if (this.props.value.length > 0) {
            this.setState({
                active: true
            });
        }
    }

    printErrorMessage() {
        if (!this.props.errorMessage) {
            return null;
        }
        return <div className="error-message">{this.props.errorMessage}</div>;
    }

    getClassName() {
        let className = `input ${this.props.className}`;
        if (this.props.errorMessage) {
            className = `${className} error`;
        }
        if (this.props.rounded) {
            className = `${className} rounded`;
        }
        if (this.props.icon) {
            className = `${className} has-icon`;
        }
        if (this.state.active) {
            className = `${className} active`;
        }
        if (this.props.large) {
            className = `${className} lg`;
        }
        return className;
    }

    onFocus() {
        this.setState({
            active: true
        });

        this.props.onFocus();
    }

    onBlur() {
        if (this.props.value.length <= 0) {
            this.setState({
                active: false
            });
        }

        this.props.validate(this.props.value, this.props.name);

        this.props.onBlur();
    }

    getInputType() {
        if (this.props.type.toLowerCase() === 'textarea') {
            return (
                <TextareaAutosize
                    rows={10}
                    maxRows={30}
                    onChange={this.props.onChange}
                    value={this.props.value}
                    name={this.props.name}
                    onKeyPress={this.props.onKeyPress}
                    autoComplete={this.props.autocomplete}
                    onBlur={this.onBlur.bind(this)}
                    onFocus={this.onFocus.bind(this)}
                />
            );
        }

        return (
            <input
                type={this.props.type}
                onChange={this.props.onChange}
                value={this.props.value}
                name={this.props.name}
                onKeyPress={this.props.onKeyPress}
                autoComplete={this.props.autocomplete}
                disabled={this.props.disabled}
                onBlur={this.onBlur.bind(this)}
                onFocus={this.onFocus.bind(this)}
            />
        );
    }

    getLabel() {
        if (!this.props.label) {
            return null;
        }

        return (
            <div className="label">
                {this.props.label}
            </div>
        );
    }

    getIcon() {
        if (!this.props.icon) {
            return null;
        }

        return (
            <i className={`fa ${this.props.icon}`} />
        );
    }

    renderMarkdown() {
        if (!this.props.markdown) {
            return null;
        }
        return (
            <div className="markdown-text">
                {t`Use Markdown in this field.`} <a
                href="https://guides.github.com/features/mastering-markdown/"
                target="_blank">{t`Markdown-syntax`}</a>
            </div>
        );
    }

    render() {
        return (
            <div className={this.getClassName()}>
                {this.renderMarkdown()}
                <div className="input-wrap">
                    {this.getLabel()}
                    {this.getIcon()}
                    {this.getInputType()}
                    {this.printErrorMessage()}
                </div>
            </div>
        );
    }
}

InputField.defaultProps = {
    onBlur: () => {
    },
    onFocus: () => {
    },
    type: 'text',
    label: '',
    value: '',
    onChange: () => {
    },
    onKeyPress: () => {
    },
    name: '',
    autocomplete: 'on',
    disabled: false,
    errorMessage: null,
    className: '',
    endButton: null,
    rounded: false,
    icon: '',
    validate: () => {
    },
    markdown: false,
    large: false
};

InputField.propTypes = {
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onKeyPress: PropTypes.func,
    name: PropTypes.string,
    autocomplete: PropTypes.oneOf(['on', 'off', 'new-password']),
    disabled: PropTypes.bool,
    errorMessage: PropTypes.string,
    className: PropTypes.string,
    endButton: PropTypes.string,
    rounded: PropTypes.bool,
    icon: PropTypes.string,
    validate: PropTypes.func,
    markdown: PropTypes.bool,
    large: PropTypes.bool
};

export default InputField;
