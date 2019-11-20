import React from 'react'

class Tags extends React.Component {
    constructor(props) {
        super(props);
    }

    clickTag(tag) {
        console.log(tag);
    }

    renderTags() {
        return this.props.tags.map((tag, i) => {
            return (
                <div key={i} onClick={this.clickTag.bind(this, tag)} className="tag">#{tag}</div>
            );
        })
    }

    render() {
        if (this.props.tags.length <= 0) {
            return null;
        }
        return (
            <div className="tags">
                {this.renderTags()}
            </div>
        );
    }
}

Tags.defaultProps = {
    tags: []
};

export default Tags;
