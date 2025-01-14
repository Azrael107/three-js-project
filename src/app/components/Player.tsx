import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Body, Vec3 } from 'cannon-es';

interface PlayerProps {
    world: any; // Cannon.js world
    playerBody: Body; // Physics body
}

export default function Player({ world, playerBody }: PlayerProps) {
    const playerMeshRef = useRef<THREE.Mesh | null>(null);

    useEffect(() => {
        if (!playerBody) return; // Return early if playerBody is not available
        // Handle keyboard input
        const handleKeyDown = (event: KeyboardEvent) => {
            const speed = 10; // Adjust the speed based on your game scale

            switch (event.key) {
                case 'w': // Forward
                    playerBody.applyForce(new Vec3(0, 0, -speed), playerBody.position);
                    break;
                case 's': // Backward
                    playerBody.applyForce(new Vec3(0, 0, speed), playerBody.position);
                    break;
                case 'a': // Left
                    playerBody.applyForce(new Vec3(-speed, 0, 0), playerBody.position);
                    break;
                case 'd': // Right
                    playerBody.applyForce(new Vec3(speed, 0, 0), playerBody.position);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [playerBody]);

    // Update the mesh position based on the physics body
    useEffect(() => {
        if (playerMeshRef.current) {
            playerMeshRef.current.position.copy(playerBody.position);
        }
    }, [playerBody.position]); // This will run every time the position of playerBody updates

    // Create player mesh (a simple cube for now)
    const geometry = new THREE.BoxGeometry(1, 2, 1); // Adjust size as needed
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const playerMesh = new THREE.Mesh(geometry, material);
    playerMesh.name = "player"; // Name the mesh to reference later if needed

    // Save the mesh reference
    playerMeshRef.current = playerMesh;

    return <primitive object={playerMesh} />;
}
