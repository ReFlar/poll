<?php
/*
 * This file is part of reflar/polls.
 *
 * Copyright (c) ReFlar.
 *
 * http://reflar.io
 *
 * For the full copyright and license information, please view the license.md
 * file that was distributed with this source code.
 */

namespace Reflar\Polls\Api\Controllers;

use DateTime;
use Flarum\Api\Controller\AbstractResourceController;
use Flarum\Core\Access\AssertPermissionTrait;
use Flarum\Core\Exception\FloodingException;
use Flarum\Core\Exception\PermissionDeniedException;
use Psr\Http\Message\ServerRequestInterface;
use Reflar\Polls\Question;
use Reflar\Polls\Vote;
use Reflar\Polls\Api\Serializers\VoteSerializer;
use Tobscure\JsonApi\Document;

class UpdateVoteController extends AbstractResourceController
{
    use AssertPermissionTrait;

    /**
     * @var string
     */
    public $serializer = VoteSerializer::class;

    /**
     * @param ServerRequestInterface $request
     * @param Document $document
     *
     * @return mixed|static
     *
     * @throws FloodingException
     * @throws PermissionDeniedException
     */
    protected function data(ServerRequestInterface $request, Document $document)
    {
        $actor = $request->getAttribute('actor');

        $attributes = $request->getParsedBody();

        $this->assertCan($actor, 'votePolls');

        $this->assertNotFlooding($actor);

        Vote::where('user_id', $actor->id)->delete();

        if (Question::find($attributes['poll_id'])->isEnded()) {
            throw new PermissionDeniedException();
        }

        $vote = Vote::build($attributes['poll_id'], $actor->id, $attributes['option_id']);

        $actor->last_vote_time = new DateTime();
        $actor->save();

        $vote->save();

        return $vote;
    }

    /**
     * @param $actor
     *
     * @throws FloodingException
     */
    public function assertNotFlooding($actor)
    {
        if (new DateTime($actor->last_vote_time) >= new DateTime('-10 seconds')) {
            throw new FloodingException();
        }
    }
}
