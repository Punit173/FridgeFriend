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
            console.log(joinedCommunities)
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
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Create Community
                    </button>
                </div>

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-emerald-800">Create New Community</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <form onSubmit={createCommunity} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Community Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newCommunity.name}
                                        onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newCommunity.description}
                                        onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-emerald-800">Your Communities</h2>
                    {joinedCommunities.length === 0 ? (
                        <div className="text-center text-gray-600 py-8">
                            You haven't joined any communities yet
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {joinedCommunities.map(community => (
                                <div key={community.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-semibold text-emerald-800">{community.name}</h3>
                                        <span className="flex items-center text-gray-600">
                                            <FaUsers className="mr-2" />
                                            {community.member_count}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mb-4">{community.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-emerald-600">
                                            <FaLeaf className="mr-2" />
                                            <span>{community.food_saved_kg} kg saved</span>
                                        </div>
                                        <div className="flex items-center text-emerald-600">
                                            <FaCheck className="mr-2" />
                                            <span>Joined</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Communities Section */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-emerald-800">Available Communities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.filter(c => !isJoined(c.id)).map(community => (
                            <div key={community.id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold text-emerald-800">{community.name}</h3>
                                    <span className="flex items-center text-gray-600">
                                        <FaUsers className="mr-2" />
                                        {community.member_count}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4">{community.description}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-emerald-600">
                                        <FaLeaf className="mr-2" />
                                        <span>{community.food_saved_kg} kg saved</span>
                                    </div>
                                    <button
                                        onClick={() => joinCommunity(community.id)}
                                        className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors"
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
    )
}

export default Community
