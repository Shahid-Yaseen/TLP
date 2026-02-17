import { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
import { useAuth } from '../contexts/AuthContext';

const PollCard = ({ poll: initialPoll }) => {
    const { user } = useAuth();
    const [poll, setPoll] = useState(initialPoll);
    const [voted, setVoted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user has already voted on this poll
        // This could also be checked from the backend if we add a 'has_voted' flag to the poll object
        if (localStorage.getItem(`poll_voted_${poll.id}`)) {
            setVoted(true);
        }
    }, [poll.id]);

    const handleVote = async (optionId) => {
        if (voted || loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_URL}/api/polls/${poll.id}/vote`, {
                option_id: optionId
            });

            setPoll(response.data.poll);
            setVoted(true);
            localStorage.setItem(`poll_voted_${poll.id}`, 'true');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record vote');
        } finally {
            setLoading(false);
        }
    };

    const totalVotes = poll.total_votes || poll.options?.reduce((sum, opt) => sum + (opt.votes_count || 0), 0) || 0;

    return (
        <div className="bg-[#1e1e1e] border-t-4 border-[#fa9a00] p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">
                POLL: {poll.question}
            </h3>

            <div className="space-y-4">
                {poll.options?.map((option) => {
                    const votes = option.votes_count || 0;
                    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

                    return (
                        <div key={option.id} className="relative">
                            {voted ? (
                                <div className="group">
                                    <div className="flex justify-between mb-1 text-sm">
                                        <span className="text-gray-100 font-semibold">{option.option_text || option.text || option.option || "Option"}</span>
                                        <span className="text-[#fa9a00] font-bold">{percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-4 rounded-full overflow-hidden">
                                        <div
                                            className="bg-[#fa9a00] h-full transition-all duration-1000 ease-out"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 mt-1 text-right">
                                        {votes} {votes === 1 ? 'vote' : 'votes'}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleVote(option.id)}
                                    disabled={loading}
                                    className="w-full text-left p-4 bg-[#2a2a2a] hover:bg-[#333333] border border-gray-700 hover:border-[#fa9a00] transition-all rounded-lg group disabled:opacity-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-semibold text-base group-hover:text-[#fa9a00] transition-colors">
                                            {option.option_text || option.text || option.option || "Option"}
                                        </span>
                                        <div className="w-4 h-4 border-2 border-gray-500 rounded-full group-hover:border-[#fa9a00] transition-colors"></div>
                                    </div>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider">
                <span>{totalVotes} {totalVotes === 1 ? 'Total Vote' : 'Total Votes'}</span>
                {voted && <span className="text-[#fa9a00] font-bold">Thanks for voting!</span>}
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-sm rounded">
                    {error}
                </div>
            )}
        </div>
    );
};

export default PollCard;
