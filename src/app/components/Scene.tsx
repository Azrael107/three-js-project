import { useEffect } from "react";
import { useInititializeThreeJS } from "../hooks/useInitializeThreeJS";


export default function Scene() {
    let scene, snowfallIntervalID, animationFrameID;

    useEffect(() => {
        const {scene, snowfallIntervalID, animationFrameID} = useInititializeThreeJS(); //hook holding all render logic
        setTimeout(() => {
            clearInterval(snowfallIntervalID);
        }, 5000);
        
    }, []);

    return (
        <>
            <div className="scene"/>
            <div className="console">
                <button />
            </div>
        </>
    );
}
