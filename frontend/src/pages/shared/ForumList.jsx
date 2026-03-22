import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { forumAPI } from '../../services/api';
import { MessageSquare, ThumbsUp, PlusCircle, ArrowLeft } from 'lucide-react';

export const ForumList = () => {
    const { courseId } = useParams();
    const { user } = useAuth();
    const [topics, setTopics] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const loadTopics = () => {
        forumAPI.getTopics(courseId).then(res => {
            if (res.data.success) setTopics(res.data.topics);
        }).catch(err => console.error(err));
    };

    useEffect(() => {
        loadTopics();
    }, [courseId]);

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        try {
            await forumAPI.createTopic({
                courseId,
                userId: user.id,
                title: newTitle,
                content: newContent
            });
            setIsCreating(false);
            setNewTitle('');
            setNewContent('');
            loadTopics();
        } catch (error) {
            console.error('Error creating topic');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Discussion Forum</h1>
                    <p className="text-gray-500 text-sm mt-1">Ask questions and discuss topics with your peers and trainers.</p>
                </div>
                {!isCreating && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <PlusCircle size={18} />
                        <span>New Topic</span>
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800">Create a New Topic</h2>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input 
                                required
                                type="text" 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="E.g., How does useState work under the hood?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
                            <textarea 
                                required
                                rows={5}
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="Elaborate on your question..."
                            />
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Post Topic
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {topics.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No topics yet</h3>
                        <p className="text-gray-500 mt-1">Be the first to start a discussion in this course!</p>
                    </div>
                ) : (
                    topics.map(topic => (
                        <Link 
                            to={`/${user.role === 'admin' || user.role === 'superadmin' ? 'super-admin' : user.role}/forum/topic/${topic.id}`}
                            key={topic.id} 
                            className="block bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-blue-700 hover:underline">{topic.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{topic.content}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 pt-2">
                                        <span className="flex items-center">
                                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-gray-600 font-bold">
                                                {topic.first_name[0]}
                                            </div>
                                            {topic.first_name} {topic.last_name} 
                                            <span className="ml-1 text-gray-400">({topic.role_id === 3 ? 'Trainer' : 'Student'})</span>
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(topic.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="flex items-center space-x-1 text-gray-500 bg-gray-50 px-3 py-1 rounded-full text-sm">
                                        <MessageSquare size={14} />
                                        <span>{topic.reply_count} replies</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                                        <ThumbsUp size={14} />
                                        <span>{topic.upvotes}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};
