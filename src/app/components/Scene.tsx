import { useEffect, useRef} from "react";
import { useInititializeThreeJS } from "../hooks/useInitializeThreeJS";
import { usePlayer } from "../hooks/usePlayer";

export default function Scene() {
    const {scene, camera, renderer, world, addLuminescentSnow, stopSnow, snowfallActiveRef, animationFrameID} = useInititializeThreeJS();

    const handleToggleSnow = () => {
        snowfallActiveRef.current = !snowfallActiveRef.current;  // Toggle the snowing state
        updateSnowEffect();
    }

    const updateSnowEffect = () => {
        if (snowfallActiveRef.current) {
            const timeout = setTimeout(() => {addLuminescentSnow();}, 1500)  
            console.log("snowfall starting momentarily...") 
            return () => clearTimeout(timeout);     
        } else {
            const timeout = setTimeout(() => {stopSnow();}, 1500);
            console.log("blizzard subsiding...")
            return () => clearTimeout(timeout);
        } 
    };

    useEffect(() => {        
       updateSnowEffect();
    },[]);
       
    return (
        <>
            <div className="scene"/>
            <div className="console">
                <button className="snow-button" onClick={handleToggleSnow}> <img src="/assets/svgs/sparkle-star.svg" alt="Snowflake Icon" className="snow-button-img" /> </button>
            </div>
        </>
    );
}
