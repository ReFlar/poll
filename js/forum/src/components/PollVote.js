import {extend} from 'flarum/extend';
import Component from 'flarum/Component';
import classList from 'flarum/utils/classList';
import LogInModal from 'flarum/components/LogInModal'

export default class PollVote extends Component {
    init() {
        this.poll = this.props.poll;
        this.votes = [];
        this.voted = m.prop(false);
        this.user = app.session.user;
        this.daysToVote = (new Date(this.poll.endDate()) - new Date()) / (1000 * 60 * 60 * 24);

        this.answers = this.poll ? this.poll.answers() : [];

        if (this.user !== undefined) {
            if (!this.user.canVote()) {
                this.voted(true)
            } else {
                app.store.find('votes', {
                    poll_id: this.poll.id(),
                    user_id: this.user.id()
                }).then((data) => {
                    if (data[0] !== undefined) {
                        this.voted(data[0])
                    } else if (this.poll.isEnded()) {
                        this.voted(true)
                    }

                    m.redraw();
                });
            }
        }

    }

    voteView() {

        if (this.voted() !== false) {
            return (
                <div>
                    <h4>{this.poll.question()}</h4>
                    {
                        this.answers.map((item) => {
                            let voted = false;
                            if (this.voted() !== true) {
                                voted = this.voted().option_id() === item.data.attributes.id;
                            }
                            const percent = item.percent();
                            return (
                                <div className='PollOption PollVoted'>
                                    <div
                                        title={item.votes() >= 1 ? item.votes() + ' ' + app.translator.trans('reflar-polls.forum.tooltip.vote') : item.votes() + ' ' + app.translator.trans('reflar-polls.forum.tooltip.votes')}
                                        className='PollBar'
                                        data-selected={voted}
                                        config={
                                            function (element) {
                                                $(element).tooltip({placement: 'right'});
                                            }
                                        }>
                                        {!this.poll.isEnded() ?
                                            <label className="checkbox">
                                                {voted ?
                                                    <input onchange={this.changeVote.bind(this, item.id())} type="checkbox" checked/>
                                                    :
                                                    <input onchange={this.changeVote.bind(this, item.id())} type="checkbox"/>
                                                }
                                                <span className="checkmark"/>
                                            </label>
                                        : ''}
                                        <div style={'--width: ' + percent + '%'} className="PollOption-active"/>
                                        <label style={!this.poll.isEnded() ? "margin-left: 25px" : ''} className="PollAnswer"><span>{item.answer()}</span></label>
                                        <label><span className={percent !== 100 ? 'PollPercent PollPercent--option' : 'PollPercent'}>{percent}%</span></label>
                                    </div>
                                </div>
                            )
                        })
                    }
                    <div className="clear"/>
                    {!this.user.canVote() ? (
                        <div className="helpText">{app.translator.trans('reflar-polls.forum.no_permission')}</div>
                    ) : this.poll.isEnded() ? (
                        <div className="helpText">{app.translator.trans('reflar-polls.forum.poll_ended')}</div>
                    ) : (
                        <div className="helpText"><i class="icon fa fa-clock-o"></i> {Math.round(this.daysToVote) >= 1 ?  app.translator.transChoice('reflar-polls.forum.days_remaining', Math.round(this.daysToVote), {count: Math.round(this.daysToVote)}) : '' }</div>
                    )}
                    <div className="clear"/>
                </div>
            );

        } else {
            return (
                <div>
                    <h4>{this.poll.question()}</h4>
                    {
                        this.answers.map((item) => (
                            <div className="PollOption">
                                <div className='PollBar'>
                                    <label className="checkbox">
                                        <input type="checkbox" onchange={this.addVote.bind(this, item.id())}/>
                                        <span>{item.answer()}</span>
                                        <span className="checkmark"/>
                                    </label>
                                </div>
                            </div>
                        ))
                    }
                    <div className="clear"/>
                </div>
            );
        }
    }

    onError(el, error) {
        el.srcElement.checked = false

        app.alerts.show(error.alert)
    }

    changeVote(answer, el) {
        app.request({
            method: 'PATCH',
            url: app.forum.attribute('apiUrl') + '/votes/' + answer,
            errorHandler: this.onError.bind(this, el),
            data: {
                option_id: answer,
                poll_id: this.poll.id()
            }
        }).then(() => {
            location.reload()
        });
    }

    view() {
        let content = this.voteView();

        return (
            <div className={classList({
                voted: this.voted
            })}>
                {content}
            </div>
        );
    }

    addVote(answer, el) {
        if (this.user === undefined) {
            app.modal.show(new LogInModal())
            el.srcElement.checked = false
        } else {
            app.store.createRecord('votes').save({
                poll_id: this.poll.id(),
                option_id: answer
            }).then(() => {
                location.reload()
            })
        }
    }
}
