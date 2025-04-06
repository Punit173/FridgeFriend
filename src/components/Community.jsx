import React, { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { supabase } from './supabase'
import { FaUsers, FaLeaf, FaChartLine, FaPlus, FaCheck, FaTimes } from 'react-icons/fa'

const Community = () => {
    const [communities, setCommunities] = useState([])
    const [joinedCommunities, setJoinedCommunities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [newCommunity, setNewCommunity] = useState({
        name: '',
        description: ''
    })

    useEffect(() => {
        fetchCommunities()
        fetchJoinedCommunities()
    }, [])

    const fetchCommunities = async () => {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
            if (error) throw error
            setCommunities(data || [])
        } catch (err) {
            setError('Failed to fetch communities')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchJoinedCommunities = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('user_communities')
                .select(`
                    community_id,
                    communities (
                        id,
                        name,
                        description,
                        member_count,
                        food_saved_kg
                    )
                `)
                .eq('user_id', user.id)

            if (error) throw error
            // console.log(data)
            setJoinedCommunities(data?.map(uc => uc.communities).filter(Boolean) || [])
            // console.log(joinedCommunities)
        } catch (err) {
            console.error('Failed to fetch joined communities:', err)
        }
    }

    const joinCommunity = async (communityId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Please login to join communities')
                return
            }

            const { error } = await supabase
                .from('user_communities')
                .insert({
                    user_id: user.id,
                    community_id: communityId
                })

            if (error) throw error

            await supabase
                .from('communities')
                .update({ member_count: 'member_count + 1' })
                .eq('id', communityId)

            fetchCommunities()
            fetchJoinedCommunities()
        } catch (err) {
            setError('Failed to join community')
            console.error(err)
        }
    }

    const createCommunity = async (e) => {
        e.preventDefault()
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Please login to create a community')
                return
            }

            const { data, error } = await supabase
                .from('communities')
                .insert({
                    name: newCommunity.name,
                    description: newCommunity.description,
                    member_count: 1
                })
                .select()
                .single()

            if (error) throw error

            await supabase
                .from('user_communities')
                .insert({
                    user_id: user.id,
                    community_id: data.id
                })

            setShowCreateModal(false)
            setNewCommunity({ name: '', description: '' })
            fetchCommunities()
            fetchJoinedCommunities()
        } catch (err) {
            setError('Failed to create community')
            console.error(err)
        }
    }

    const isJoined = (communityId) => {
        return joinedCommunities.some(c => c.id === communityId)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading communities...</div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-white">Communities</h1>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                        >
                            <FaPlus className="mr-2" />
                            Create Community
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {/* Joined Communities Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-white">Your Communities</h2>
                        {joinedCommunities.length === 0 ? (
                            <div className="bg-gray-800 p-6 rounded-lg text-gray-300">
                                You haven't joined any communities yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {joinedCommunities.map(community => (
                                    <div key={community.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold text-white">{community.name}</h3>
                                            <span className="flex items-center text-gray-400">
                                                <FaUsers className="mr-2" />
                                                {community.member_count}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 mb-4">{community.description}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-blue-400">
                                                <FaLeaf className="mr-2" />
                                                <span>{community.food_saved_kg} kg saved</span>
                                            </div>
                                            <div className="flex items-center text-green-400">
                                                <FaCheck className="mr-2" />
                                                <span>Joined</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 text-white">Community Leaderboard</h2>
                        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Community</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Food Saved (kg)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Members</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {[...communities]
                                        .sort((a, b) => b.food_saved_kg - a.food_saved_kg)
                                        .slice(0, 10)
                                        .map((community, index) => (
                                            <tr key={community.id} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                                    {community.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-400">
                                                    <div className="flex items-center">
                                                        <FaLeaf className="mr-2" />
                                                        {community.food_saved_kg}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    <div className="flex items-center">
                                                        <FaUsers className="mr-2" />
                                                        {community.member_count}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold mb-6 text-white">Available Communities</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communities.filter(c => !isJoined(c.id)).map(community => (
                                <div key={community.id} className="bg-gray-800 rounded-lg shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-white">{community.name}</h3>
                                        <span className="flex items-center text-gray-400">
                                            <FaUsers className="mr-2" />
                                            {community.member_count}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 mb-4">{community.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-blue-400">
                                            <FaLeaf className="mr-2" />
                                            <span>{community.food_saved_kg} kg saved</span>
                                        </div>
                                        <button
                                            onClick={() => joinCommunity(community.id)}
                                            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <FaPlus className="mr-2" />
                                            Join
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h2 className="text-2xl font-bold mb-4 text-white">Create New Community</h2>
                        <form onSubmit={createCommunity} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Community Name</label>
                                <input
                                    type="text"
                                    value={newCommunity.name}
                                    onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={newCommunity.description}
                                    onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                                    className="w-full p-2 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Community
