import * as THREE from 'three';
        import * as CANNON from 'cannon-es';
        import { initializeApp } from 'firebase/app';
        import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
        import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

        document.addEventListener('DOMContentLoaded', () => {

                        // #############################################
            // ### SEASON 1 MODAL LOGIC                ###
            // #############################################
            const seasonModal = document.getElementById('season-modal');
            const closeSeasonModalBtn = document.getElementById('close-season-modal');

            // Show Season Modal Once Per Session
            if (!sessionStorage.getItem('season1ModalShown')) {
                setTimeout(() => {
                    seasonModal.classList.remove('hidden');
                    sessionStorage.setItem('season1ModalShown', 'true'); // Set flag
                }, 3500); // Show after 3.5 seconds (slightly longer delay for main page)
            }

            // Season Modal Event Listeners
            closeSeasonModalBtn.addEventListener('click', () => {
                seasonModal.classList.add('hidden');
            });

            seasonModal.addEventListener('click', (e) => {
                if (e.target === seasonModal) { // Clicked on the overlay
                    seasonModal.classList.add('hidden');
                }
            });
            // ### END SEASON 1 MODAL LOGIC ###
            // ### Event Listener for the new Season Headline Button ###
            const mainViewPrizesBtn = document.getElementById('main-view-prizes-btn');
            if (mainViewPrizesBtn) {
                mainViewPrizesBtn.addEventListener('click', () => {
                    const seasonModal = document.getElementById('season-modal');
                    if (seasonModal) {
                        seasonModal.classList.remove('hidden');
                    }
                });
            }

            // #############################################
            // ### FIREBASE SETUP                      ###
            // #############################################
            
            const firebaseConfig = {
                apiKey: "AIzaSyD02ui4dhTuGLz-Ff1af36ERdqqsn4iIeU",
                authDomain: "falconixgaming-46210.firebaseapp.com",
                projectId: "falconixgaming-46210",
                storageBucket: "falconixgaming-46210.appspot.com",
                messagingSenderId: "1096905282147",
                appId: "1:1096905282147:web:e2faa9105d31c6ec009e56",
                measurementId: "G-VJ6YC0GXK5"
            };

            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const provider = new GoogleAuthProvider();

            // --- UI Elements ---
            const loginButton = document.getElementById('login-button');
            const mobileLoginButton = document.getElementById('mobile-login-button');
            const logoutButton = document.getElementById('logout-button');
            const mobileLogoutButton = document.getElementById('mobile-logout-button');
            const userInfo = document.getElementById('user-info');
            const mobileUserInfo = document.getElementById('mobile-user-info');
            const userDisplayName = document.getElementById('user-display-name');
            const mobileUserDisplayName = document.getElementById('mobile-user-display-name');
            const leaderboardContent = document.getElementById('leaderboard-content');
            const leaderboardLoginPrompt = document.getElementById('leaderboard-login-prompt');
            const logoutModal = document.getElementById('logout-modal');
            const confirmLogoutBtn = document.getElementById('confirm-logout-btn');
            const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
            const mobileWelcomeModal = document.getElementById('mobile-welcome-modal');
            const closeWelcomeModal = document.getElementById('close-welcome-modal');
            const modalLoginButton = document.getElementById('modal-login-button');

            // --- Auth Functions ---
            const signInWithGoogle = () => {
                signInWithPopup(auth, provider).catch(e => console.error(e));
                hideWelcomeModal();
            };
            
            const showLogoutModal = () => logoutModal.classList.remove('hidden');
            const hideLogoutModal = () => logoutModal.classList.add('hidden');

            const logout = () => {
                signOut(auth).catch(e => console.error(e));
                hideLogoutModal();
            };

            const showWelcomeModal = () => {
                if (sessionStorage.getItem('welcomeModalShown')) return;
                setTimeout(() => {
                    mobileWelcomeModal.classList.remove('hidden');
                    sessionStorage.setItem('welcomeModalShown', 'true');
                }, 2000);
            };

            const hideWelcomeModal = () => mobileWelcomeModal.classList.add('hidden');

            loginButton.addEventListener('click', signInWithGoogle);
            mobileLoginButton.addEventListener('click', signInWithGoogle);
            modalLoginButton.addEventListener('click', signInWithGoogle);
            logoutButton.addEventListener('click', showLogoutModal);
            mobileLogoutButton.addEventListener('click', showLogoutModal);
            confirmLogoutBtn.addEventListener('click', logout);
            cancelLogoutBtn.addEventListener('click', hideLogoutModal);
            closeWelcomeModal.addEventListener('click', hideWelcomeModal);
            logoutModal.addEventListener('click', (e) => {
                if (e.target === logoutModal) hideLogoutModal();
            });
            mobileWelcomeModal.addEventListener('click', (e) => {
                if (e.target === mobileWelcomeModal) hideWelcomeModal();
            });


// --- High Score Functions ---
        const saveHighScore = async (gameName, newScore, scoreType = 'desc') => {
            const user = auth.currentUser;
            console.log("saveHighScore: Current user object:", user); // Debug log
            if (!user || !gameName || typeof newScore !== 'number') {
                 console.log("saveHighScore: Aborted (no user, gameName, or newScore is not a number)");
                return;
            }

            const personalScoreRef = doc(db, "highscores", user.uid);
            // *** 1. GET PLAYER NAME ***
            const playerName = user.displayName || 'Anonymous'; // Get display name, fallback to Anonymous
            console.log("saveHighScore: User display name:", user.displayName); // Debug log

            try {
                const docSnap = await getDoc(personalScoreRef);
                const currentData = docSnap.exists() ? docSnap.data() : {};
                const currentScore = currentData[gameName];
                
                let shouldUpdatePersonal = false;
                if (scoreType === 'desc') { // Higher is better
                    if (currentScore === undefined || newScore > currentScore) {
                        shouldUpdatePersonal = true;
                    }
                } else { // Lower is better (asc)
                    if (currentScore === undefined || newScore < currentScore) {
                        shouldUpdatePersonal = true;
                    }
                }

                // *** 2. CHECK IF NAME ALSO NEEDS UPDATING ***
                const shouldUpdateName = !currentData.playerName || currentData.playerName !== playerName;

                // *** 3. ONLY WRITE IF NECESSARY ***
                // Only write to the DB if the score is new OR the name is missing/different
                if (shouldUpdatePersonal || shouldUpdateName) {
                    
                    // Construct the data payload
                    let dataToSave = {
                        playerName: playerName // Always include the latest name
                    };

                    if (shouldUpdatePersonal) {
                        dataToSave[gameName] = newScore; // Add the new high score
                        console.log(`saveHighScore: New personal best for ${gameName}: ${newScore}`);
                    } else {
                        console.log(`saveHighScore: Updating playerName for ${user.uid}.`);
                    }
                    
                    console.log("saveHighScore: Data being saved:", dataToSave); // Debug log
                    
                    // *** 4. SAVE THE DATA (SCORE + NAME) ***
                    await setDoc(personalScoreRef, dataToSave, { merge: true });

                    if (shouldUpdatePersonal) {
                        displayUserHighScores(user); // Update local UI if score changed
                    }
                } else {
                    console.log(`saveHighScore: No update needed for ${gameName}. Score (${newScore}) is not better than (${currentScore}) and name is correct.`);
                }

            } catch (error) {
                console.error("Error saving high score: ", error);
            }
        };
            
            const displayUserHighScores = async (user) => {
                if (user) {
                    leaderboardContent.style.display = 'grid';
                    leaderboardLoginPrompt.style.display = 'none';
                    const scoreRef = doc(db, "highscores", user.uid);
                    const docSnap = await getDoc(scoreRef);
                    const scores = docSnap.exists() ? docSnap.data() : {};
                    
                    const games = ["Astro Jumper", "Car Racer", "Tower Defense", "Memory Match"];
                    leaderboardContent.innerHTML = games.map(game => {
                        const score = scores[game] || 0;
                        let scoreLabel = 'Points';
                        if (game === 'Tower Defense') scoreLabel = 'Waves';
                        if (game === 'Memory Match') scoreLabel = 'Moves';

                        return `
                        <div class="glassmorphism p-6 rounded-xl text-center">
                            <h3 class="text-2xl font-bold text-indigo-300">${game}</h3>
                            <p class="text-4xl font-black-ops text-white mt-4">${score}</p>
                            <p class="text-gray-400 mt-1">${scoreLabel}</p>
                        </div>
                        `;
                    }).join('');

                } else {
                    leaderboardContent.style.display = 'none';
                    leaderboardLoginPrompt.style.display = 'block';
                    leaderboardContent.innerHTML = '';
                }
            };


            // --- Auth State Change Listener ---
            onAuthStateChanged(auth, (user) => {
                const isLoggedIn = !!user;
                loginButton.style.display = isLoggedIn ? 'none' : 'flex';
                mobileLoginButton.style.display = isLoggedIn ? 'none' : 'block';
                userInfo.style.display = isLoggedIn ? 'flex' : 'none';
                mobileUserInfo.style.display = isLoggedIn ? 'block' : 'none';

                if (user) {
                    userDisplayName.innerHTML = `${user.displayName} <br> <span class="text-xs text-gray-400">${user.email}</span>`;
                    mobileUserDisplayName.innerHTML = `${user.displayName} <br> <span class="text-xs text-gray-400">${user.email}</span>`;
                    hideWelcomeModal();
                } else {
                    const isMobile = window.innerWidth <= 768;
                    if (isMobile) {
                        showWelcomeModal();
                    }
                }
                displayUserHighScores(user);
            });
            // --- Handle Login Redirect ---
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('login') === 'true') {
                // Check if a user is already signed in
                if (!auth.currentUser) {
                    signInWithGoogle();
                }
            }
            
            // #############################################
            // ### MOBILE MENU TOGGLE                  ###
            // #############################################
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');

            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            // #############################################
            // ### HOW TO PLAY SECTION                 ###
            // #############################################
            const gameInfoButtons = document.querySelectorAll('.game-info-btn');
            const gameExplanationResultEl = document.getElementById('gameExplanationResult');

            const gameExplanations = {
                "Astro Jumper": {
                    objective: "Survive as long as possible by jumping from one platform to the next without falling into the void.",
                    gameplay: "Your character moves forward automatically. Your only job is to time your jumps perfectly to land on the next platform.",
                    desktop_controls: "Click anywhere on the screen to jump.",
                    mobile_controls: "Tap anywhere on the screen to jump."
                },
                "Car Racer": {
                    objective: "Dodge the oncoming traffic for as long as you can to get the highest possible score.",
                    gameplay: "You control a car at the bottom of the screen. Other cars will drive down towards you, and you must move left and right to avoid crashing.",
                    desktop_controls: "Use the Left and Right Arrow Keys to move your car.",
                    mobile_controls: "Touch and drag your finger left or right on the screen to move the car."
                },
                "Tower Defense": {
                    objective: "Prevent enemies from reaching the end of the path by building and placing defensive towers.",
                    gameplay: "Use your starting gold to build turrets on the grass. Defeated enemies give you more gold to build more towers. Survive as many waves as you can!",
                    desktop_controls: "Click the 'Turret' button, then click on a valid green tile to place it. Click 'Next Wave' to start the attack.",
                    mobile_controls: "Tap the 'Turret' button, then tap on a valid green tile to place it. Tap 'Next Wave' to start the attack."
                },
                 "Tic-Tac-Toe": {
                    objective: "Be the first player to get three of your marks in a row, either horizontally, vertically, or diagonally.",
                    gameplay: "Players take turns placing their mark ('X' or 'O') in an empty square on a 3x3 grid. The game ends when one player wins or the board is full, resulting in a draw.",
                    desktop_controls: "Click on an empty square to place your mark.",
                    mobile_controls: "Tap on an empty square to place your mark."
                },
                "Memory Match": {
                    objective: "Find all the matching pairs of cards in the fewest number of moves.",
                    gameplay: "Click or tap on a card to flip it over. Then, try to find its matching pair. If the cards don't match, they will be flipped back over.",
                    desktop_controls: "Click on a card to flip it.",
                    mobile_controls: "Tap on a card to flip it."
                }
            };

            gameInfoButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const gameName = button.dataset.game;
                    showGameExplanation(gameName);
                });
            });

            function showGameExplanation(gameName) {
                const info = gameExplanations[gameName];
                if (info) {
                    gameExplanationResultEl.innerHTML = `
                        <div class="glassmorphism p-8 rounded-2xl text-left max-w-2xl w-full">
                            <h3 class="text-2xl font-bold text-indigo-300">Objective</h3>
                            <p class="mt-2 text-gray-300">${info.objective}</p>
                            <h3 class="text-2xl font-bold text-indigo-300 mt-4">Gameplay</h3>
                            <p class="mt-2 text-gray-300">${info.gameplay}</p>
                            <h3 class="text-2xl font-bold text-indigo-300 mt-4">Controls</h3>
                            <p class="mt-2 text-gray-300"><strong class="text-white">Desktop:</strong> ${info.desktop_controls}</p>
                            <p class="mt-2 text-gray-300"><strong class="text-white">Mobile:</strong> ${info.mobile_controls}</p>
                        </div>
                    `;
                }
            }

            // #############################################
            // ### SHARE SCORE FUNCTIONALITY           ###
            // #############################################
            const shareModal = document.getElementById('shareModal');
            const closeShareModalBtn = document.getElementById('closeShareModal');
            const copyShareTextBtn = document.getElementById('copyShareText');
            
            function shareScore(gameName, score, scoreType = 'points') {
                const url = window.location.origin + window.location.pathname;
                let text = `I just scored ${score} ${scoreType} in ${gameName} on FalconixGaming! Can you beat my score?`;

                if (navigator.share) {
                    navigator.share({
                        title: `My ${gameName} Score!`,
                        text: `${text}\n\nPlay now!`,
                        url: url,
                    })
                    .then(() => console.log('Successful share'))
                    .catch((error) => console.log('Error sharing', error));
                } else {
                    const shareTextEl = document.getElementById('shareText');
                    const whatsappLink = document.getElementById('whatsappShareLink');
                    const twitterLink = document.getElementById('twitterShareLink');

                    const fullShareText = `${text}\n\nPlay now: ${url}`;
                    shareTextEl.value = fullShareText;
                    whatsappLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
                    twitterLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`;
                    
                    shareModal.classList.remove('hidden');
                }
            }

            closeShareModalBtn.addEventListener('click', () => shareModal.classList.add('hidden'));
            copyShareTextBtn.addEventListener('click', () => {
                const shareTextEl = document.getElementById('shareText');
                shareTextEl.select();
                shareTextEl.setSelectionRange(0, 99999); // For mobile devices
                document.execCommand('copy');
                copyShareTextBtn.textContent = 'Copied!';
                setTimeout(() => { copyShareTextBtn.textContent = 'Copy Text'; }, 2000);
            });

            // #############################################
            // ### ASTRO JUMPER (3D GAME) CODE         ###
            // #############################################
            const gameContainer = document.getElementById('gameContainer');
            const canvas = document.getElementById('gameCanvas');
            const startScreen = document.getElementById('startScreen');
            const playButton = document.getElementById('playButton');
            const restartButton = document.getElementById('restartButton');
            const scoreElement = document.getElementById('score');
            const finalScoreElement = document.getElementById('finalScore');
            const shareAstroJumperScoreBtn = document.getElementById('shareAstroJumperScore');
            let isGameRunning = false;
            let score = 0;
            let player, playerBody;
            const platforms = [];
            const platformBodies = [];
            let nextPlatformX = 0;
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -20, 0) });
            
            function initAstroJumper() {
                renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.shadowMap.enabled = true;
                renderer.setClearColor(0x111827, 1);
                camera.position.set(0, 5, 15);
                camera.lookAt(0, 0, 0);
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(10, 20, 5);
                directionalLight.castShadow = true;
                scene.add(directionalLight);
                createStarfield();
                resetAstroJumper();
                animateAstroJumper();
            }
            function createStarfield() {
                const starVertices = [];
                for (let i = 0; i < 10000; i++) { starVertices.push(THREE.MathUtils.randFloatSpread(2000), THREE.MathUtils.randFloatSpread(2000), THREE.MathUtils.randFloatSpread(2000)); }
                const starGeometry = new THREE.BufferGeometry();
                starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
                const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0x888888 }));
                scene.add(stars);
            }
            function createPlayer() {
                const geometry = new THREE.IcosahedronGeometry(0.5, 0);
                const material = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, flatShading: true });
                player = new THREE.Mesh(geometry, material);
                player.castShadow = true;
                scene.add(player);
                const shape = new CANNON.Sphere(0.5);
                playerBody = new CANNON.Body({ mass: 1, shape });
                playerBody.position.set(0, 5, 0);
                world.addBody(playerBody);
            }
            function createPlatform(x, y, z, isFirst = false) {
                const width = isFirst ? 4 : THREE.MathUtils.randFloat(2.5, 4);
                const geometry = new THREE.BoxGeometry(width, 0.5, 3);
                const material = new THREE.MeshStandardMaterial({ color: 0x475569, flatShading: true });
                const platform = new THREE.Mesh(geometry, material);
                platform.position.set(x, y, z);
                platform.receiveShadow = true;
                scene.add(platform);
                platforms.push(platform);
                const shape = new CANNON.Box(new CANNON.Vec3(width / 2, 0.5 / 2, 3 / 2));
                const platformBody = new CANNON.Body({ mass: 0, shape, material: new CANNON.Material() });
                platformBody.position.set(x, y, z);
                world.addBody(platformBody);
                platformBodies.push(platformBody);
            }
            function generatePlatforms() {
                createPlatform(0, 0, 0, true);
                nextPlatformX = 0;
                for (let i = 0; i < 15; i++) generateNextPlatform();
            }
            function generateNextPlatform() {
                const lastPlatform = platforms[platforms.length - 1];
                const x = lastPlatform.position.x + THREE.MathUtils.randFloat(5, 8);
                const y = lastPlatform.position.y + THREE.MathUtils.randFloat(-1.5, 1.5);
                createPlatform(x, y, 0);
                nextPlatformX = x;
            }
            function playerJump() {
                if (!isGameRunning) return;
                const from = playerBody.position;
                const to = new CANNON.Vec3(from.x, from.y - 0.51, from.z);
                if (world.raycastClosest(from, to, {}, new CANNON.RaycastResult())) { playerBody.velocity.y = 10; }
            }
            function resetAstroJumper() {
                platforms.forEach(p => scene.remove(p));
                platformBodies.forEach(b => world.removeBody(b));
                if (player) scene.remove(player);
                if (playerBody) world.removeBody(playerBody);
                platforms.length = 0;
                platformBodies.length = 0;
                createPlayer();
                playerBody.velocity.x = 6;
                generatePlatforms();
                score = 0;
                scoreElement.innerText = '0';
                camera.position.set(0, 5, 15);
            }
            function startAstroJumper() {
                resetAstroJumper();
                isGameRunning = true;
                document.getElementById('uiLayer').classList.add('pointer-events-passthrough');
                document.getElementById('uiLayer').style.backgroundColor = 'transparent';
                document.getElementById('startScreen').style.display = 'none';
                document.getElementById('gameOverScreen').style.display = 'none';
                document.getElementById('inGameUI').style.display = 'block';
            }
            async function endAstroJumper() {
                isGameRunning = false;
                finalScoreElement.innerText = score;
                await saveHighScore('Astro Jumper', score);
                document.getElementById('uiLayer').classList.remove('pointer-events-passthrough');
                document.getElementById('uiLayer').style.backgroundColor = 'rgba(0,0,0,0.5)';
                document.getElementById('inGameUI').style.display = 'none';
                document.getElementById('gameOverScreen').style.display = 'flex';
            }
            function animateAstroJumper() {
                requestAnimationFrame(animateAstroJumper);
                if (isGameRunning) {
                    world.step(1 / 60);
                    if (player && playerBody) {
                        player.position.copy(playerBody.position);
                        player.quaternion.copy(playerBody.quaternion);

                        const newScore = Math.floor(player.position.x);
                        if (newScore > score) {
                            score = newScore;
                            scoreElement.innerText = score;
                        }
                    }
                    const targetCameraX = player.position.x + 5;
                    const targetCameraY = player.position.y + 5;
                    camera.position.x += (targetCameraX - camera.position.x) * 0.05;
                    camera.position.y += (targetCameraY - camera.position.y) * 0.05;
                    camera.lookAt(player.position.x, player.position.y, player.position.z);
                    if (player.position.x > nextPlatformX - 20) generateNextPlatform();
                    if (platforms.length > 20) {
                        scene.remove(platforms.shift());
                        world.removeBody(platformBodies.shift());
                    }
                    if (player.position.y < -10 || player.position.y > 20) endAstroJumper();
                }
                renderer.render(scene, camera);
            }
            playButton.addEventListener('click', startAstroJumper);
            restartButton.addEventListener('click', startAstroJumper);
            gameContainer.addEventListener('click', playerJump);
            shareAstroJumperScoreBtn.addEventListener('click', () => {
                shareScore('Astro Jumper', score, 'points');
            });
            document.getElementById('astro-jumper-card').addEventListener('click', () => {
                document.getElementById('featured-game').scrollIntoView({ behavior: 'smooth' });
            });
            initAstroJumper();

            // #############################################
            // ### CAR RACER (2D GAME) CODE            ###
            // #############################################
            const racerModal = document.getElementById('pixelRacerModal');
            const playRacerBtn = document.getElementById('pixel-racer-card');
            const closeRacerBtn = document.getElementById('closeRacerModal');
            const racerCanvas = document.getElementById('racerGameCanvas');
            const racerCtx = racerCanvas.getContext('2d');
            const racerStartScreen = document.getElementById('racerStartScreen');
            const racerInGameUI = document.getElementById('racerInGameUI');
            const racerGameOverScreen = document.getElementById('racerGameOverScreen');
            const racerStartButton = document.getElementById('racerStartButton');
            const racerRestartButton = document.getElementById('racerRestartButton');
            const racerScoreEl = document.getElementById('racerScore');
            const racerFinalScoreEl = document.getElementById('racerFinalScore');
            const shareRacerScoreBtn = document.getElementById('shareRacerScore');
            
            let racerRunning = false;
            let racerScore = 0;
            let animationFrameId;
            let playerCar, obstacles, roadLines;
            const keys = { ArrowLeft: false, ArrowRight: false };

            // --- Car Image Loading ---
            const carImageSrcs = [
                'https://i.ibb.co/N639DgRG/car-png-top-view-png-hatchback-car-top-view-png-clipart-1092.png', // Player Car
                'https://www.seekpng.com/png/full/54-544318_car-top-view-png.png',
                'https://www.seekpng.com/png/full/38-388934_28-collection-of-car-clipart-top-view-top.png',
                'https://www.seekpng.com/png/full/54-545057_clipart-orange-rental-car-key-icon-royalty-free.png',
                'https://www.seekpng.com/png/full/44-446913_45-top-view-of-car-clipart-images-green.png'
            ];
            const carImages = [];
            let imagesLoaded = 0;

            racerStartButton.disabled = true;
            racerStartButton.textContent = 'Loading...';

            carImageSrcs.forEach(src => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    imagesLoaded++;
                    if (imagesLoaded === carImageSrcs.length) {
                         racerStartButton.disabled = false;
                         racerStartButton.textContent = 'Start Race';
                    }
                };
                carImages.push(img);
            });
            
            const playerCarImg = carImages[0];
            const obstacleCarImgs = carImages.slice(1);

            function openRacerModal() {
                racerModal.classList.remove('invisible', 'opacity-0');
                racerCanvas.width = racerCanvas.parentElement.clientWidth;
                racerCanvas.height = racerCanvas.parentElement.clientHeight;
                showRacerStartScreen();
            }
            function closeRacerModal() {
                racerModal.classList.add('invisible', 'opacity-0');
                stopRacerGame();
            }
            function showRacerStartScreen() {
                racerStartScreen.style.display = 'flex';
                racerInGameUI.style.display = 'none';
                racerGameOverScreen.style.display = 'none';
            }
            function startRacerGame() {
                stopRacerGame();
                racerRunning = true;
                racerScore = 0;
                const carWidth = 45;
                const carHeight = 80;
                playerCar = { x: racerCanvas.width / 2 - (carWidth/2), y: racerCanvas.height - (carHeight + 20), width: carWidth, height: carHeight, speed: 7, img: playerCarImg };
                obstacles = [];
                roadLines = [];
                for (let i = 0; i < 8; i++) spawnObstacle();
                for (let i = 0; i < 5; i++) roadLines.push({ y: i * (racerCanvas.height / 4) });
                racerStartScreen.style.display = 'none';
                racerGameOverScreen.style.display = 'none';
                racerInGameUI.style.display = 'block';
                gameLoop();
            }
            function stopRacerGame() {
                racerRunning = false;
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
            async function endRacerGame() {
                stopRacerGame();
                const finalRacerScore = Math.floor(racerScore);
                racerFinalScoreEl.textContent = finalRacerScore;
                await saveHighScore('Car Racer', finalRacerScore);
                racerGameOverScreen.style.display = 'flex';
                racerInGameUI.style.display = 'none';
            }
            function spawnObstacle() {
                const carWidth = 45;
                const carHeight = 80;
                const lastObstacleY = obstacles.length > 0 ? obstacles[obstacles.length - 1].y : -200;
                
                let speed = 3 + Math.random() * 2 + (racerScore / 50);

                obstacles.push({ 
                    x: Math.random() * (racerCanvas.width - carWidth), 
                    y: lastObstacleY - (Math.random() * 200 + 300), 
                    width: carWidth, 
                    height: carHeight, 
                    speed: speed,
                    img: obstacleCarImgs[Math.floor(Math.random() * obstacleCarImgs.length)]
                });
            }
            function update() {
                if (!racerRunning) return;
                racerScore += 0.1;
                racerScoreEl.textContent = Math.floor(racerScore);
                if (keys.ArrowLeft && playerCar.x > 0) playerCar.x -= playerCar.speed;
                if (keys.ArrowRight && playerCar.x < racerCanvas.width - playerCar.width) playerCar.x += playerCar.speed;
                roadLines.forEach(line => { line.y += 4 + (racerScore / 100) ; if (line.y > racerCanvas.height) line.y = -40; });
                obstacles.forEach((obs, index) => {
                    obs.y += obs.speed;
                    if (obs.y > racerCanvas.height) {
                        obstacles.splice(index, 1);
                        spawnObstacle();
                    }
                    if (playerCar.x < obs.x + obs.width && playerCar.x + playerCar.width > obs.x && playerCar.y < obs.y + obs.height && playerCar.y + playerCar.height > obs.y) {
                        endRacerGame();
                    }
                });
            }
            function draw() {
                racerCtx.fillStyle = '#374151';
                racerCtx.fillRect(0, 0, racerCanvas.width, racerCanvas.height);
                racerCtx.fillStyle = '#6b7280';
                const laneWidth = racerCanvas.width / 3;
                roadLines.forEach(line => {
                    racerCtx.fillRect(laneWidth - 5, line.y, 10, 40);
                    racerCtx.fillRect(laneWidth * 2 - 5, line.y, 10, 40);
                });7

                // Draw player car image
                racerCtx.drawImage(playerCar.img, playerCar.x, playerCar.y, playerCar.width, playerCar.height);
                
                // Draw obstacle car images
                obstacles.forEach(obs => {
                    racerCtx.drawImage(obs.img, obs.x, obs.y, obs.width, obs.height);
                });
            }
            function gameLoop() {
                update();
                draw();
                if (racerRunning) {
                    animationFrameId = requestAnimationFrame(gameLoop);
                }
            }
            playRacerBtn.addEventListener('click', openRacerModal);
            closeRacerBtn.addEventListener('click', closeRacerModal);
            racerStartButton.addEventListener('click', startRacerGame);
            racerRestartButton.addEventListener('click', startRacerGame);
            shareRacerScoreBtn.addEventListener('click', () => {
                shareScore('Car Racer', Math.floor(racerScore), 'points');
            });
            window.addEventListener('keydown', (e) => {
                if (racerModal.classList.contains('invisible')) return;
                if (e.key in keys) { e.preventDefault(); keys[e.key] = true; }
            });
            window.addEventListener('keyup', (e) => {
                if (racerModal.classList.contains('invisible')) return;
                if (e.key in keys) { e.preventDefault(); keys[e.key] = false; }
            });
            function handleTouch(e) {
                if (racerModal.classList.contains('invisible') || !racerRunning) return;
                e.preventDefault();
                const touchX = e.touches[0].clientX;
                const racerCanvasRect = racerCanvas.getBoundingClientRect();
                let targetX = touchX - racerCanvasRect.left - (playerCar.width / 2);
                if (targetX < 0) targetX = 0;
                if (targetX > racerCanvas.width - playerCar.width) targetX = racerCanvas.width - playerCar.width;
                playerCar.x = targetX;
            }
            racerCanvas.addEventListener('touchstart', handleTouch, { passive: false });
            racerCanvas.addEventListener('touchmove', handleTouch, { passive: false });

            // #############################################
            // ### TOWER DEFENSE (2D GAME) CODE        ###
            // #############################################
            
            const tdModal = document.getElementById('towerDefenseModal');
            const playTDButton = document.getElementById('tower-defense-card');
            const closeTDButton = document.getElementById('closeTowerDefenseModal');
            const tdCanvas = document.getElementById('towerDefenseCanvas');
            const tdCtx = tdCanvas.getContext('2d');
            const tdStartScreen = document.getElementById('tdStartScreen');
            const tdInGameUI = document.getElementById('tdInGameUI');
            const tdGameOverScreen = document.getElementById('tdGameOverScreen');
            const tdStartButton = document.getElementById('tdStartButton');
            const tdRestartButton = document.getElementById('tdRestartButton');
            const tdHealthEl = document.getElementById('tdHealth');
            const tdGoldEl = document.getElementById('tdGold');
            const tdWaveEl = document.getElementById('tdWave');
            const tdEndTitleEl = document.getElementById('tdEndTitle');
            const tdFinalWaveEl = document.getElementById('tdFinalWave');
            const shareTDScoreBtn = document.getElementById('shareTDScore');
            const buyTurretButton = document.getElementById('buyTurretButton');
            const nextWaveButton = document.getElementById('nextWaveButton');
            let tdRunning = false;
            let health, gold, wave;
            let enemies = [];
            let towers = [];
            let projectiles = [];
            let selectedTower = null;
            let waveInProgress = false;
            let mousePos = { x: 0, y: 0 };
            let grid = [];
            let TILE_SIZE = 50;
            const GRID_COLS = 16;
            const GRID_ROWS = 12;
            const pathCoords = [ {x: 0, y: 5}, {x: 3, y: 5}, {x: 3, y: 2}, {x: 7, y: 2}, {x: 7, y: 8}, {x: 12, y: 8}, {x: 12, y: 4}, {x: 16, y: 4} ];

            function openTDModal() {
                tdModal.classList.remove('invisible', 'opacity-0');
                setupTDGrid();
                tdStartScreen.style.display = 'block';
                tdInGameUI.style.display = 'none';
                tdGameOverScreen.style.display = 'none';
            }
            function closeTDModal() {
                tdModal.classList.add('invisible', 'opacity-0');
                stopTDGame();
            }
            function setupTDGrid() {
                const parent = tdCanvas.parentElement;
                const size = Math.min(parent.clientWidth, parent.clientHeight);
                tdCanvas.width = size;
                tdCanvas.height = size * (GRID_ROWS / GRID_COLS);
                TILE_SIZE = tdCanvas.width / GRID_COLS;
                grid = [];
                for (let y = 0; y < GRID_ROWS; y++) { grid.push(Array(GRID_COLS).fill(0)); }
                for (let i = 0; i < pathCoords.length - 1; i++) {
                    let start = pathCoords[i];
                    let end = pathCoords[i+1];
                    if (start.x === end.x) {
                        for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) { if (grid[y]) grid[y][start.x] = 1; }
                    } else {
                        for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) { if (grid[start.y]) grid[start.y][x] = 1; }
                    }
                }
            }
            function startTDGame() {
                tdRunning = true;
                health = 20;
                gold = 250;
                wave = 0;
                enemies = [];
                towers = [];
                projectiles = [];
                selectedTower = null;
                waveInProgress = false;
                setupTDGrid();
                updateTDUI();
                tdStartScreen.style.display = 'none';
                tdGameOverScreen.style.display = 'none';
                tdInGameUI.style.display = 'block';
                nextWaveButton.style.display = 'block';
                gameLoopTD();
            }
            function stopTDGame() { tdRunning = false; }
            function updateTDUI() {
                tdHealthEl.textContent = health;
                tdGoldEl.textContent = gold;
                tdWaveEl.textContent = wave;
            }
            function startNextWave() {
                if (waveInProgress) return;
                wave++;
                waveInProgress = true;
                nextWaveButton.style.display = 'none';
                updateTDUI();
                const enemyCount = wave * 5 + 5;
                for (let i = 0; i < enemyCount; i++) {
                    const enemyHealth = 50 + wave * 15;
                    enemies.push({ x: -TILE_SIZE * i * 1.5, y: pathCoords[0].y * TILE_SIZE, speed: 1 + wave * 0.05, health: enemyHealth, maxHealth: enemyHealth, pathIndex: 0 });
                }
            }
            function gameLoopTD() {
                if (!tdRunning) return;
                tdCtx.clearRect(0, 0, tdCanvas.width, tdCanvas.height);
                drawTDGrid();
                drawTDPath();
                towers.forEach(t => { t.update(); t.draw(); });
                projectiles.forEach((p, i) => { p.update(i); p.draw(); });
                
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const e = enemies[i];
                    const status = updateEnemy(e);
                    if (status === 'finished') {
                        enemies.splice(i, 1);
                        health--;
                        updateTDUI();
                        if (health <= 0) endGameTD(false);
                    } else if (e.health <= 0) {
                        enemies.splice(i, 1);
                        gold += 10;
                        updateTDUI();
                    } else {
                        drawEnemy(e);
                    }
                }

                if (waveInProgress && enemies.length === 0) {
                    waveInProgress = false;
                    nextWaveButton.style.display = 'block';
                    if (wave >= 10) endGameTD(true);
                }
                if (selectedTower) drawPlacementPreview();
                requestAnimationFrame(gameLoopTD);
            }
            function drawTDGrid() {
                tdCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                for (let i = 0; i < GRID_COLS; i++) {
                    tdCtx.beginPath();
                    tdCtx.moveTo(i * TILE_SIZE, 0);
                    tdCtx.lineTo(i * TILE_SIZE, tdCanvas.height);
                    tdCtx.stroke();
                }
                for (let i = 0; i < GRID_ROWS; i++) {
                    tdCtx.beginPath();
                    tdCtx.moveTo(0, i * TILE_SIZE);
                    tdCtx.lineTo(tdCanvas.width, i * TILE_SIZE);
                    tdCtx.stroke();
                }
            }
            function drawTDPath() {
                tdCtx.fillStyle = '#374151';
                for(let y=0; y < grid.length; y++) {
                    for(let x=0; x < grid[y].length; x++) {
                        if(grid[y][x] === 1) {
                            tdCtx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                        }
                    }
                }
            }
            function drawEnemy(enemy) {
                tdCtx.fillStyle = '#ef4444';
                tdCtx.fillRect(enemy.x, enemy.y, TILE_SIZE * 0.6, TILE_SIZE * 0.6);
                tdCtx.fillStyle = '#4b5563';
                tdCtx.fillRect(enemy.x, enemy.y - 10, TILE_SIZE * 0.6, 5);
                tdCtx.fillStyle = '#22c55e';
                tdCtx.fillRect(enemy.x, enemy.y - 10, TILE_SIZE * 0.6 * (enemy.health / enemy.maxHealth), 5);
            }
            function updateEnemy(enemy) {
                if (enemy.pathIndex >= pathCoords.length - 1) {
                    return 'finished';
                }
                const endPoint = pathCoords[enemy.pathIndex + 1];
                const targetX = endPoint.x * TILE_SIZE;
                const targetY = endPoint.y * TILE_SIZE;
                const dx = targetX - enemy.x;
                const dy = targetY - enemy.y;
                const distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < enemy.speed) {
                    enemy.pathIndex++;
                } else {
                    enemy.x += (dx / distance) * enemy.speed;
                    enemy.y += (dy / distance) * enemy.speed;
                }
                return 'alive';
            }
            function createTower(gridX, gridY) {
                const tower = {
                    x: (gridX + 0.5) * TILE_SIZE, y: (gridY + 0.5) * TILE_SIZE, range: TILE_SIZE * 2.5, fireRate: 45, fireCooldown: 0,
                    draw() {
                        tdCtx.fillStyle = '#10b981';
                        tdCtx.beginPath();
                        tdCtx.arc(this.x, this.y, TILE_SIZE/3, 0, Math.PI * 2);
                        tdCtx.fill();
                    },
                    update() {
                        this.fireCooldown--;
                        if (this.fireCooldown <= 0) {
                            const target = this.findTarget();
                            if (target) { this.shoot(target); this.fireCooldown = this.fireRate; }
                        }
                    },
                    findTarget() {
                        for (const enemy of enemies) {
                            const dx = this.x - (enemy.x + (TILE_SIZE * 0.3));
                            const dy = this.y - (enemy.y + (TILE_SIZE * 0.3));
                            if (Math.sqrt(dx*dx + dy*dy) < this.range) return enemy;
                        }
                        return null;
                    },
                    shoot(target) {
                        projectiles.push({
                            x: this.x, y: this.y, target: target, speed: 5,
                            update(i) {
                                if(!this.target || this.target.health <= 0) { projectiles.splice(i, 1); return; }
                                const dx = (this.target.x + TILE_SIZE * 0.3) - this.x;
                                const dy = (this.target.y + TILE_SIZE * 0.3) - this.y;
                                const dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist < this.speed) {
                                    this.target.health -= 25;
                                    projectiles.splice(i, 1);
                                } else {
                                    this.x += (dx/dist) * this.speed;
                                    this.y += (dy/dist) * this.speed;
                                }
                            },
                            draw() {
                                tdCtx.fillStyle = '#facc15';
                                tdCtx.beginPath();
                                tdCtx.arc(this.x, this.y, 5, 0, Math.PI * 2);
                                tdCtx.fill();
                            }
                        });
                    }
                };
                towers.push(tower);
                grid[gridY][gridX] = 2;
            }
            function getMousePos(canvas, evt) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const clientX = evt.clientX || (evt.touches && evt.touches[0].clientX);
                const clientY = evt.clientY || (evt.touches && evt.touches[0].clientY);
                if (clientX === undefined) return {x:0, y:0};
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }
            function handleCanvasClick(e) {
                if (!selectedTower) return;
                const pos = getMousePos(tdCanvas, e);
                const gridX = Math.floor(pos.x / TILE_SIZE);
                const gridY = Math.floor(pos.y / TILE_SIZE);
                if (grid[gridY] && grid[gridY][gridX] === 0) {
                    createTower(gridX, gridY);
                    gold -= 100;
                    updateTDUI();
                    selectedTower = null;
                }
            }
            function drawPlacementPreview() {
                const gridX = Math.floor(mousePos.x / TILE_SIZE);
                const gridY = Math.floor(mousePos.y / TILE_SIZE);
                const centerX = (gridX + 0.5) * TILE_SIZE;
                const centerY = (gridY + 0.5) * TILE_SIZE;
                let isValidPlacement = false;
                if(grid[gridY] && grid[gridY][gridX] === 0) { isValidPlacement = true; }
                tdCtx.fillStyle = isValidPlacement ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)';
                tdCtx.beginPath();
                tdCtx.arc(centerX, centerY, TILE_SIZE * 2.5, 0, Math.PI * 2);
                tdCtx.fill();
                tdCtx.fillStyle = '#16a34a';
                tdCtx.beginPath();
                tdCtx.arc(centerX, centerY, TILE_SIZE/3, 0, Math.PI * 2);
                tdCtx.fill();
            }
            async function endGameTD(win) {
                stopTDGame();
                await saveHighScore('Tower Defense', wave);
                tdInGameUI.style.display = 'none';
                tdGameOverScreen.style.display = 'flex';
                tdEndTitleEl.textContent = win ? "VICTORY!" : "DEFEAT!";
                tdFinalWaveEl.textContent = wave;
            }
            playTDButton.addEventListener('click', openTDModal);
            closeTDButton.addEventListener('click', closeTDModal);
            tdStartButton.addEventListener('click', startTDGame);
            tdRestartButton.addEventListener('click', startTDGame);
            shareTDScoreBtn.addEventListener('click', () => {
                shareScore('Tower Defense', wave, 'waves');
            });
            nextWaveButton.addEventListener('click', startNextWave);
            buyTurretButton.addEventListener('click', () => { if (gold >= 100) selectedTower = 'turret'; });
            tdCanvas.addEventListener('mousemove', e => { mousePos = getMousePos(tdCanvas, e); });
            tdCanvas.addEventListener('touchmove', e => { mousePos = getMousePos(tdCanvas, e); });
            tdCanvas.addEventListener('click', handleCanvasClick);
            tdCanvas.addEventListener('touchend', e => { if (selectedTower) { handleCanvasClick(e); e.preventDefault(); } });
            
            // #############################################
            // ### TIC-TAC-TOE (2D GAME) CODE          ###
            // #############################################
            const ticTacToeModal = document.getElementById('ticTacToeModal');
            const playTTTBtn = document.getElementById('tic-tac-toe-card');
            const closeTTTBtn = document.getElementById('closeTicTacToeModal');
            let tttInitialized = false;

            function openTTTModal() {
                ticTacToeModal.classList.remove('invisible', 'opacity-0');
                if (!tttInitialized) {
                    initTicTacToe();
                    tttInitialized = true;
                }
            }

            function closeTTTModal() {
                ticTacToeModal.classList.add('invisible', 'opacity-0');
            }
            
            playTTTBtn.addEventListener('click', openTTTModal);
            closeTTTBtn.addEventListener('click', closeTTTModal);

            function initTicTacToe() {
                const statusDisplay = document.getElementById('ttt-status');
                const cells = document.querySelectorAll('.ttt-cell');
                const restartButton = document.getElementById('ttt-restart-button');
                const nextRoundButton = document.getElementById('ttt-next-round-button');
                const scoreXDisplay = document.getElementById('ttt-score-x');
                const scoreODisplay = document.getElementById('ttt-score-o');

                let gameActive = true;
                let startingPlayer = 'X';
                let currentPlayer = 'X';
                let gameState = ["", "", "", "", "", "", "", "", ""];
                let scoreX = 0;
                let scoreO = 0;

                const winningConditions = [
                    [0, 1, 2], [3, 4, 5], [6, 7, 8],
                    [0, 3, 6], [1, 4, 7], [2, 5, 8],
                    [0, 4, 8], [2, 4, 6]
                ];

                const winningMessage = () => `Player ${currentPlayer} wins! 🎉`;
                const drawMessage = () => `It's a draw! 🤝`;
                const currentPlayerTurn = () => `Player ${currentPlayer}'s turn`;

                function handleCellClick(event) {
                    const clickedCell = event.target;
                    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
                    if (gameState[clickedCellIndex] !== "" || !gameActive) return;
                    
                    handleCellPlayed(clickedCell, clickedCellIndex);
                    handleResultValidation();
                }

                function handleCellPlayed(clickedCell, clickedCellIndex) {
                    gameState[clickedCellIndex] = currentPlayer;
                    clickedCell.textContent = currentPlayer;
                    clickedCell.classList.add(currentPlayer === 'X' ? 'text-red-500' : 'text-blue-400');
                }

                function handleResultValidation() {
                    let roundWon = false;
                    let winningLine = [];
                    for (const winCondition of winningConditions) {
                        const a = gameState[winCondition[0]];
                        const b = gameState[winCondition[1]];
                        const c = gameState[winCondition[2]];
                        if (a === '' || b === '' || c === '') continue;
                        if (a === b && b === c) {
                            roundWon = true;
                            winningLine = winCondition;
                            break;
                        }
                    }

                    if (roundWon) {
                        statusDisplay.textContent = winningMessage();
                        gameActive = false;
                        if (currentPlayer === 'X') {
                            scoreX++;
                            scoreXDisplay.textContent = scoreX;
                        } else {
                            scoreO++;
                            scoreODisplay.textContent = scoreO;
                        }
                        winningLine.forEach(index => cells[index].classList.add('winning-cell'));
                        nextRoundButton.classList.remove('hidden');
                        return;
                    }

                    if (!gameState.includes("")) {
                        statusDisplay.textContent = drawMessage();
                        gameActive = false;
                        nextRoundButton.classList.remove('hidden');
                        return;
                    }
                    handlePlayerChange();
                }

                function handlePlayerChange() {
                    currentPlayer = currentPlayer === "X" ? "O" : "X";
                    statusDisplay.textContent = currentPlayerTurn();
                }
                
                function startNextRound() {
                    gameActive = true;
                    startingPlayer = startingPlayer === 'X' ? 'O' : 'X';
                    currentPlayer = startingPlayer;
                    gameState = ["", "", "", "", "", "", "", "", ""];
                    statusDisplay.textContent = currentPlayerTurn();
                    cells.forEach(cell => {
                        cell.textContent = "";
                        cell.classList.remove('text-red-500', 'text-blue-400', 'winning-cell');
                    });
                    nextRoundButton.classList.add('hidden');
                }

                function handleRestartGame() {
                    scoreX = 0;
                    scoreO = 0;
                    scoreXDisplay.textContent = '0';
                    scoreODisplay.textContent = '0';
                    startingPlayer = 'X';
                    startNextRound();
                }

                cells.forEach(cell => cell.addEventListener('click', handleCellClick));
                nextRoundButton.addEventListener('click', startNextRound);
                restartButton.addEventListener('click', handleRestartGame);

                statusDisplay.textContent = currentPlayerTurn();
            }

            // #############################################
            // ### MEMORY MATCH (2D GAME) CODE         ###
            // #############################################
            const memoryMatchModal = document.getElementById('memoryMatchModal');
            const memoryMatchWinModal = document.getElementById('memoryMatchWinModal');
            const playMemoryMatchBtn = document.getElementById('memory-match-card');
            const closeMemoryMatchBtn = document.getElementById('closeMemoryMatchModal');
            const shareMemoryScoreBtn = document.getElementById('shareMemoryScore');
            let memoryMatchInitialized = false;

            function openMemoryMatchModal() {
                memoryMatchModal.classList.remove('invisible', 'opacity-0');
                if (!memoryMatchInitialized) {
                    initMemoryMatch();
                    memoryMatchInitialized = true;
                }
            }

            function closeMemoryMatchModal() {
                memoryMatchModal.classList.add('invisible', 'opacity-0');
            }
            
            playMemoryMatchBtn.addEventListener('click', openMemoryMatchModal);
            closeMemoryMatchBtn.addEventListener('click', closeMemoryMatchModal);

            function initMemoryMatch() {
                const gameBoard = document.getElementById('memory-game-board');
                const movesCountSpan = document.getElementById('moves-count');
                const restartButton = document.getElementById('memory-restart-button');
                const restartButtonWin = document.getElementById('memoryRestartButtonWin');
                const memoryFinalMovesEl = document.getElementById('memoryFinalMoves');
                const cardSymbols = ['🚀', '🔥', '⭐', '🎉', '💎', '💯', '👾', '🏆'];
                let cards = [...cardSymbols, ...cardSymbols];

                let flippedCards = [];
                let matchedPairs = 0;
                let moves = 0;
                let lockBoard = false;

                function shuffle(array) {
                    for (let i = array.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [array[i], array[j]] = [array[j], array[i]];
                    }
                }

                function createBoard() {
                    shuffle(cards);
                    gameBoard.innerHTML = '';
                    cards.forEach(symbol => {
                        const cardElement = document.createElement('div');
                        cardElement.classList.add('memory-card', 'h-24');
                        cardElement.dataset.symbol = symbol;

                        cardElement.innerHTML = `
                            <div class="memory-card-face memory-card-front"></div>
                            <div class="memory-card-face memory-card-back">${symbol}</div>
                        `;

                        cardElement.addEventListener('click', handleCardClick);
                        gameBoard.appendChild(cardElement);
                    });
                }

                function handleCardClick(event) {
                    const clickedCard = event.currentTarget;
                    if (lockBoard || clickedCard.classList.contains('is-flipped')) return;

                    flipCard(clickedCard);

                    if (flippedCards.length < 2) {
                        flippedCards.push(clickedCard);
                    }

                    if (flippedCards.length === 2) {
                        incrementMoves();
                        checkForMatch();
                    }
                }

                function flipCard(card) {
                    card.classList.add('is-flipped');
                }
                
                function unflipCards() {
                    lockBoard = true;
                    setTimeout(() => {
                        flippedCards.forEach(card => card.classList.remove('is-flipped'));
                        resetFlippedCards();
                    }, 1000);
                }

                function checkForMatch() {
                    const [card1, card2] = flippedCards;
                    const isMatch = card1.dataset.symbol === card2.dataset.symbol;

                    if (isMatch) {
                        disableMatchedCards();
                    } else {
                        unflipCards();
                    }
                }
                
                async function disableMatchedCards() {
                    flippedCards.forEach(card => {
                        card.removeEventListener('click', handleCardClick);
                        card.classList.add('matched');
                    });
                    matchedPairs++;
                    resetFlippedCards();

                    if (matchedPairs === cardSymbols.length) {
                       await saveHighScore('Memory Match', moves, 'asc');
                       memoryFinalMovesEl.textContent = moves;
                       setTimeout(() => {
                           memoryMatchWinModal.classList.remove('hidden');
                       }, 500);
                    }
                }
                
                function resetFlippedCards() {
                    flippedCards = [];
                    lockBoard = false;
                }

                function incrementMoves() {
                    moves++;
                    movesCountSpan.textContent = moves;
                }
                
                function restartGame() {
                    moves = 0;
                    matchedPairs = 0;
                    movesCountSpan.textContent = '0';
                    resetFlippedCards();
                    createBoard();
                    memoryMatchWinModal.classList.add('hidden');
                }

                restartButton.addEventListener('click', restartGame);
                restartButtonWin.addEventListener('click', restartGame);
                shareMemoryScoreBtn.addEventListener('click', () => {
                    shareScore('Memory Match', moves, 'moves');
                });
                createBoard();
            }


            window.addEventListener('resize', () => {
                camera.aspect = gameContainer.clientWidth / gameContainer.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(gameContainer.clientWidth, gameContainer.clientHeight);
                if(racerCanvas) {
                    racerCanvas.width = racerCanvas.parentElement.clientWidth;
                    racerCanvas.height = racerCanvas.parentElement.clientHeight;
                }
                if(tdCanvas) {
                    setupTDGrid();
                }
            });
        });
        
