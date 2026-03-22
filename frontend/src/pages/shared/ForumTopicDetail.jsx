import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { forumAPI } from '../../services/api';
import { ArrowLeft, ThumbsUp, MessageSquare, CheckCircle } from 'lucide-react';

export const ForumTopicDetail = () => {
    const { topicId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [topic, setTopic] = useState(null);
    const [replies, setReplies] = useState([]);
    const [newReply, setNewReply] = useState('');

    const loadTopicDetails = () => {
        forumAPI.getTopicDetails(topicId).then(res => {
            if (res.data.success) {
                setTopic(res.data.topic);
                setReplies(res.data.replies);
            }
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        loadTopicDetails();
    }, [topicId]);

    const handleUpvoteTopic = async () => {
        await forumAPI.upvoteTopic(topicId);
        loadTopicDetails();
    };

    const handleUpvoteReply = async (replyId) => {
        await forumAPI.upvoteReply(replyId);
        loadTopicDetails();
    };

    const handleAcceptReply = async (replyId) => {
        // Only author (or trainer) can accept
        if (user.id !== topic.user_id && user.role !== 'trainer') return;
        await forumAPI.acceptReply(replyId);
        loadTopicDetails();
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        try {
            await forumAPI.createReply({
                topicId,
                userId: user.id,
                content: newReply
            });
            setNewReply('');
            loadTopicDetails();
        } catch (error) {
            console.error('Error posting reply');
        }
    };

    if (!topic) return <div className="p-10 text-center">Loading topic...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <button 
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-800 transition"
            >
                <ArrowLeft size={16} />
                <span>Back to Discussions</span>
            </button>

            {/* Topic Main Post */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex gap-4">
                    <div className="flex flex-col items-center space-y-2">
                        <button onClick={handleUpvoteTopic} className="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 p-2 rounded-full transition">
                            <ThumbsUp size={24} />
                        </button>
                        <span className="font-semibold text-lg text-gray-700">{topic.upvotes}</span>
                    </div>
                    <div className="flex-1 space-y-4">
                        <h1 className="text-2xl font-bold text-gray-900">{topic.title}</h1>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{topic.content}</p>
                        <div className="flex items-center space-x-3 text-sm text-gray-500 pt-4 border-t border-gray-50">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {topic.first_name[0]}
                            </div>
                            <span>By <span className="font-medium">{topic.first_name} {topic.last_name}</span></span>
                            <span>•</span>
                            <span>{new Date(topic.created_at).toLocaleString()}</span>
                            <span>•</span>
                            <span className="capitalize">{topic.role_id === 3 ? 'Trainer' : 'Student'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Replies Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <MessageSquare size={18} className="mr-2" />
                    {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                </h3>
                
                <div className="space-y-4">
                    {replies.map(reply => (
                        <div key={reply.id} className={`bg-white p-5 rounded-xl border ${reply.is_accepted ? 'border-green-400 ring-1 ring-green-400 shadow-sm' : 'border-gray-200'}`}>
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center space-y-1">
                                    <button onClick={() => handleUpvoteReply(reply.id)} className="text-gray-400 hover:text-blue-600 transition">
                                        <ThumbsUp size={20} />
                                    </button>
                                    <span className="font-medium text-gray-600">{reply.upvotes}</span>
                                    {reply.is_accepted && (
                                        <CheckCircle className="text-green-500 mt-2" size={20} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <p className="text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <span className="font-medium text-gray-700">{reply.first_name} {reply.last_name}</span>
                                            <span className="px-2 py-0.5 bg-gray-100 rounded-full">{reply.role_id === 3 ? 'Trainer' : 'Student'}</span>
                                            <span>• {new Date(reply.created_at).toLocaleString()}</span>
                                        </div>
                                        {((user.id === topic.user_id || user.role === 'trainer') && !reply.is_accepted) && (
                                            <button onClick={() => handleAcceptReply(reply.id)} className="text-xs text-green-600 hover:text-green-700 font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200 transition">
                                                Mark as Accepted
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Post Reply Form */}
            <div className="bg-slate-50 p-6 rounded-xl border border-gray-200 mt-8">
                <h3 className="text-md font-semibold text-gray-800 mb-3">Your Answer</h3>
                <form onSubmit={handleSubmitReply}>
                    <textarea 
                        required
                        rows={4}
                        value={newReply}
                        onChange={e => setNewReply(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3"
                        placeholder="Type your response here..."
                    />
                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                        >
                            Post Reply
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
