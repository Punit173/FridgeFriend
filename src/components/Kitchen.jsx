import React, { useState } from "react";
import Spline from "@splinetool/react-spline";
import Navbar from "./Navbar";
import { generateResponse } from "../config/gemini";

const Kitchen = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [response, setResponse] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError("");
        setResponse("");

        try {
            const prompt = `You are a kitchen assistant. Please provide information about: ${searchQuery}. I'm organizing or cooking in a kitchen where the cup and saucer are on the left of the gas stove, bread loaf on the right, wine bottles, pan, and toaster on the kitchen stand. Spoons, knives, spatula, and utensils are in the first two drawers of the table, while flour and cornflour are in the shelf next to them. Salt, sugar, pepper, cumin, tea leaves, and spices are in the rack near the basin. The fridge holds coldrinks, veggies, eggs, milk, juice, and chocolates. The dining set is in the two rightmost drawers, with lentils stored in shelves left of those drawers. Just answer the location of the asked ingredients nothing more than that. if someone asks more than that say not present in kitchen `;
            const result = await generateResponse(prompt);
            setResponse(result);
        } catch (err) {
            setError("Failed to get response. Please try again.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Ask about any food item or kitchen-related question"
                                className="flex-1 px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
                            >
                                {isLoading ? "Searching..." : "Search"}
                            </button>
                        </div>
                    </form>

                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {response && (
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h2 className="text-xl font-semibold mb-4 text-white">Response</h2>
                            <p className="text-gray-300 whitespace-pre-wrap">{response}</p>
                        </div>
                    )}

                    <div className="mt-8">
                        <div className="flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden">
                            <Spline scene="https://prod.spline.design/zcs6vGfhbKvor7oc/scene.splinecode" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Kitchen;