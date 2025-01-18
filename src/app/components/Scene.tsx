import { useEffect, useState} from "react";
import { useInititializeThreeJS } from "../hooks/useInitializeThreeJS";

export default function Scene() {
    const {scene, camera, renderer, world, addLuminescentSnow, stopSnow, animationFrameID} = useInititializeThreeJS();
    const [isSnowing, setIsSnowing] = useState(false);  // Add state to manage snowing

    useEffect(() => {        
        if (isSnowing) {
            const timeout = setTimeout(() => {addLuminescentSnow();}, 1500)   
            return () => clearTimeout(timeout);     
        } else {
            const timeout = setTimeout(() => {stopSnow();}, 1500);
            return () => clearTimeout(timeout);
        }        
    }, [isSnowing, addLuminescentSnow, stopSnow]);

    const handleToggleSnow = () => {
        setIsSnowing(prevState => !prevState);  // Toggle the snowing state
    }

    return (
        <>
            <div className="scene"/>
            <div className="console">
                <button className="snow-button" onClick={handleToggleSnow}> <img src="/assets/svgs/sparkle-star.svg" alt="Snowflake Icon" className="snow-button-img" /> </button>
            </div>
        </>
    );
}
