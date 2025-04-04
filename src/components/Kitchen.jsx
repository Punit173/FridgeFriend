import React from "react";
import Spline from "@splinetool/react-spline";
import Navbar from "./Navbar";

const Kitchen = () => {
    return (
        <>
            <Navbar />
            <div className="h-screen flex items-center justify-center bg-gray-200">
                {/* <Spline scene="https://prod.spline.design/TlqkLfl6LJmJZFj4/scene.splinecode" /> */}
                <Spline scene="https://prod.spline.design/zcs6vGfhbKvor7oc/scene.splinecode" />
            </div>
        </>
    );
};

export default Kitchen;
