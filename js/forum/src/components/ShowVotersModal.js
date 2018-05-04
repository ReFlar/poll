import Modal from 'flarum/components/Modal';
import ItemList from 'flarum/utils/ItemList';
import avatar from 'flarum/helpers/avatar';
import username from 'flarum/helpers/username';
import listItems from 'flarum/helpers/listItems';

export default class ShowVotersModal extends Modal {
    className() {
        return 'Modal--small';
    }

    title() {
        return app.translator.trans('reflar-polls.forum.votes_modal.title');
    }

    getUsers(answer) {
        const items = new ItemList();

        this.props.votes().map(vote => {
            var user = app.store.getById('users', vote.user_id())

            if (parseInt(answer.id()) === vote.option_id()) {
                items.add(user.id(), (
                    <a href={app.route.user(user)} config={m.route}>
                        {avatar(user)} {' '}
                        {username(user)}
                    </a>
                ))
            }
        })

        return items;
    }

    content() {
        return (
            <div className="Modal-body">
                <ul className="VotesModal-list">
                    {this.props.answers().map(answer => (
                        <div>
                            <h3>{answer.answer() + ':'}</h3>
                            {listItems(this.getUsers(answer).toArray())}
                        </div>
                    ))}
                </ul>
            </div>
        )
    }
}