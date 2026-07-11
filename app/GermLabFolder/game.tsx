import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFirebase } from '../../contexts/FirebaseContext';

export default function GameScreen() {
	// Firebase integration
	const { startGameSession, completeScenario, completeGame, logToolSelection, sendGermBusterData } = useFirebase();
	
	// Game state
	const [currentImage, setCurrentImage] = useState('GarbagePile');
	const [gameOver, setGameOver] = useState(false);
	const [gameComplete, setGameComplete] = useState(false);
	const [score, setScore] = useState(0);
	const [showNextImage, setShowNextImage] = useState(false);
	const [showThirdImage, setShowThirdImage] = useState(false);
	const [showFourthImage, setShowFourthImage] = useState(false);
	const [showFifthImage, setShowFifthImage] = useState(false);
	const [showSixthImage, setShowSixthImage] = useState(false);
	const [showSeventhImage, setShowSeventhImage] = useState(false);
	const [showEighthImage, setShowEighthImage] = useState(false);
	const [showNinthImage, setShowNinthImage] = useState(false);
	const [showTenthImage, setShowTenthImage] = useState(false);
	const [gameStartTime, setGameStartTime] = useState<number | null>(null);
	const [scenariosCompleted, setScenariosCompleted] = useState(0);

	// Animation values
	const garbageTranslateX = useSharedValue(300); // Start from far right side
	const garbageOpacity = useSharedValue(0); // Start invisible
	const nextImageTranslateX = useSharedValue(300); // For next image animation
	const nextImageOpacity = useSharedValue(0); // For next image animation
	const thirdImageTranslateX = useSharedValue(300); // For third image animation
	const thirdImageOpacity = useSharedValue(0); // For third image animation
	const fourthImageTranslateX = useSharedValue(300); // For fourth image animation
	const fourthImageOpacity = useSharedValue(0); // For fourth image animation
	const fifthImageTranslateX = useSharedValue(300); // For fifth image animation
	const fifthImageOpacity = useSharedValue(0); // For fifth image animation
	const sixthImageTranslateX = useSharedValue(300); // For sixth image animation
	const sixthImageOpacity = useSharedValue(0); // For sixth image animation
	const seventhImageTranslateX = useSharedValue(300); // For seventh image animation
	const seventhImageOpacity = useSharedValue(0); // For seventh image animation
	const eighthImageTranslateX = useSharedValue(300); // For eighth image animation
	const eighthImageOpacity = useSharedValue(0); // For eighth image animation
	const ninthImageTranslateX = useSharedValue(300); // For ninth image animation
	const ninthImageOpacity = useSharedValue(0); // For ninth image animation
	const tenthImageTranslateX = useSharedValue(300); // For tenth image animation
	const tenthImageOpacity = useSharedValue(0); // For tenth image animation
	
	// Hero image animation values
	const heroScale = useSharedValue(1);
	const heroRotation = useSharedValue(0);
	
	// Title animation values
	const titleScale = useSharedValue(1);
	const titleOpacity = useSharedValue(1);
	
	// Tools animation values
	const toolsScale = useSharedValue(1);
	const toolsOpacity = useSharedValue(1);
	
	// Glitter animation values
	const glitterOpacity = useSharedValue(0);
	const glitterScale = useSharedValue(0);
	const glitterRotation = useSharedValue(0);
	const glitterOrbitX = useSharedValue(0);
	const glitterOrbitY = useSharedValue(0);
	
	// Score animation values
	const scoreScale = useSharedValue(1);
	const scoreColor = useSharedValue(0); // 0 for normal, 1 for positive, -1 for negative
	
	// Refs for animation functions to avoid scope issues
	const titleAnimationRef = useRef<(() => void) | null>(null);
	const toolsAnimationRef = useRef<(() => void) | null>(null);
	const heroAnimationRef = useRef<(() => void) | null>(null);

	// Start animation when component mounts
	useEffect(() => {
		// Initialize Firebase game session
		const initializeGame = async () => {
			try {
				await startGameSession('Player');
				setGameStartTime(Date.now());
				
				// Send initial GermBuster data
				await sendGermBusterData({
					level: 1,
					playerName: 'Player',
					score: 0,
					testConnection: 'success'
				});
			} catch (error) {
				console.error('Error initializing game session:', error);
			}
		};
		
		initializeGame();
		
		// Start the animation after a short delay
		const timer = setTimeout(() => {
			garbageTranslateX.value = withTiming(0, { duration: 2000 });
			garbageOpacity.value = withTiming(1, { duration: 2000 });
		}, 1000);

		// Start title pulsing animation
		const startTitleAnimation = () => {
			titleScale.value = withTiming(1.1, { duration: 1500 });
			setTimeout(() => {
				titleScale.value = withTiming(1, { duration: 1500 });
				setTimeout(startTitleAnimation, 3000);
			}, 1500);
		};
		
		// Start tools pulsing animation
		const startToolsAnimation = () => {
			toolsScale.value = withTiming(1.05, { duration: 2000 });
			setTimeout(() => {
				toolsScale.value = withTiming(1, { duration: 2000 });
				setTimeout(startToolsAnimation, 4000);
			}, 2000);
		};
		
		// Start hero image pulsing animation
		const startHeroAnimation = () => {
			heroScale.value = withTiming(1.08, { duration: 2500 });
			setTimeout(() => {
				heroScale.value = withTiming(1, { duration: 2500 });
				setTimeout(startHeroAnimation, 5000);
			}, 2500);
		};
		
		// Store animation functions in refs
		titleAnimationRef.current = startTitleAnimation;
		toolsAnimationRef.current = startToolsAnimation;
		heroAnimationRef.current = startHeroAnimation;
		
		// Start all pulsing animations immediately
		startTitleAnimation();
		startToolsAnimation();
		startHeroAnimation();

		return () => clearTimeout(timer);
	}, []);

	// Function to update score with animation
	const updateScore = (points: number) => {
		setScore(prevScore => prevScore + points);
		
		// Animate score change
		scoreScale.value = withTiming(1.3, { duration: 200 }, (finished) => {
			if (finished) {
				scoreScale.value = withTiming(1, { duration: 200 });
			}
		});
		
		// Set color based on positive or negative change
		if (points > 0) {
			scoreColor.value = withTiming(1, { duration: 300 }, (finished) => {
				if (finished) {
					scoreColor.value = withTiming(0, { duration: 700 });
				}
			});
		} else {
			scoreColor.value = withTiming(-1, { duration: 300 }, (finished) => {
				if (finished) {
					scoreColor.value = withTiming(0, { duration: 700 });
				}
			});
		}
	};

	// Handle tool click
	const handleToolClick = (toolName: string) => {
		if (!showNextImage && !showThirdImage && !showFourthImage && !showFifthImage && !showSixthImage) {
			// First scenario: GarbagePile - need DustBin
			setShowNextImage(true);
			if (toolName === 'DustBin') {
				setScenariosCompleted(prev => prev + 1);
				updateScore(10); // +10 for correct tool
				logToolSelection(toolName, true, 'GarbagePile');
				completeScenario({
					scenario: 'GarbagePile',
					toolUsed: toolName,
					timeTaken: gameStartTime ? Date.now() - gameStartTime : 0,
					points: 100
				});
				
				// Send GermBuster data for scenario completion
				sendGermBusterData({
					level: 1,
					playerName: 'Player',
					score: score + 10,
					testConnection: 'success'
				});
			} else {
				updateScore(-10); // -10 for wrong tool
				logToolSelection(toolName, false, 'GarbagePile');
			}
			setTimeout(() => {
				nextImageTranslateX.value = withTiming(0, { duration: 2000 });
				nextImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showNextImage && !showThirdImage && !showFourthImage && !showFifthImage && !showSixthImage) {
			// Second scenario: DirtyTooth - need ToothBrush
			setShowThirdImage(true);
			if (toolName === 'ToothBrush') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				thirdImageTranslateX.value = withTiming(0, { duration: 2000 });
				thirdImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showThirdImage && !showFourthImage && !showFifthImage && !showSixthImage) {
			// Third scenario: CoughingKid - need FaceMask
			setShowSixthImage(true);
			if (toolName === 'FaceMask') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				sixthImageTranslateX.value = withTiming(0, { duration: 2000 });
				sixthImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showSixthImage && !showSeventhImage) {
			// Fourth scenario: SanitizeHand_Image - need Sanitizer_Bottle
			setShowSeventhImage(true);
			if (toolName === 'Sanitizer_Bottle') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				seventhImageTranslateX.value = withTiming(0, { duration: 2000 });
				seventhImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showSeventhImage && !showEighthImage && !showNinthImage) {
			// Fifth scenario: Dirty Floor - need Broom
			setShowEighthImage(true);
			if (toolName === 'Broom') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				eighthImageTranslateX.value = withTiming(0, { duration: 2000 });
				eighthImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showEighthImage && !showNinthImage) {
			// Sixth scenario: Dirty Water Drinking Girl - need Filter_Water
			setShowNinthImage(true);
			if (toolName === 'Filter_Water') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				ninthImageTranslateX.value = withTiming(0, { duration: 2000 });
				ninthImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showNinthImage && !showTenthImage) {
			// Seventh scenario: Dirty Body Kid - need ShowerHead
			setShowTenthImage(true);
			if (toolName === 'ShowerHead') {
				updateScore(10); // +10 for correct tool
			} else {
				updateScore(-10); // -10 for wrong tool
			}
			setTimeout(() => {
				tenthImageTranslateX.value = withTiming(0, { duration: 2000 });
				tenthImageOpacity.value = withTiming(1, { duration: 2000 });
			}, 500);
		} else if (showTenthImage) {
			// Eighth scenario: Dirty Hands - need Soap
			if (toolName === 'Soap') {
				// Complete final scenario
				setScenariosCompleted(prev => prev + 1);
				updateScore(10); // +10 for correct tool
				logToolSelection(toolName, true, 'DirtyHands');
				completeScenario({
					scenario: 'DirtyHands',
					toolUsed: toolName,
					timeTaken: gameStartTime ? Date.now() - gameStartTime : 0,
					points: 100
				});
				
				// Complete the entire game
				const finalScore = scenariosCompleted * 100 + 100; // 8 scenarios * 100 points each
				completeGame(finalScore);
				
				// Send final GermBuster data
				sendGermBusterData({
					level: 1,
					playerName: 'Player',
					score: finalScore,
					testConnection: 'success'
				});
				
				// Start glitter animation
				glitterOpacity.value = withTiming(1, { duration: 500 });
				glitterScale.value = withTiming(1, { duration: 800 });
				glitterRotation.value = withTiming(360, { duration: 2000 });
				
				// Start circular orbit animation
				const startOrbitAnimation = () => {
					glitterOrbitX.value = withTiming(100, { duration: 3000 });
					glitterOrbitY.value = withTiming(100, { duration: 3000 });
					
					setTimeout(() => {
						glitterOrbitX.value = withTiming(-100, { duration: 3000 });
						glitterOrbitY.value = withTiming(-100, { duration: 3000 });
						
						setTimeout(() => {
							glitterOrbitX.value = withTiming(0, { duration: 3000 });
							glitterOrbitY.value = withTiming(0, { duration: 3000 });
							
							setTimeout(startOrbitAnimation, 3000);
						}, 3000);
					}, 3000);
				};
				setTimeout(startOrbitAnimation, 1000);
				
				// Game completed successfully - show success message
				setGameComplete(true);
			} else {
				updateScore(-10); // -10 for wrong tool
				logToolSelection(toolName, false, 'DirtyHands');
				// For the final scenario, we don't advance to next image since it's the last one
				// The game will stay on this scenario until the correct tool is selected
			}
		}
	};

	// Animated style for garbage pile
	const garbageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: garbageTranslateX.value }],
			opacity: garbageOpacity.value,
		};
	});

	// Animated style for next image
	const nextImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: nextImageTranslateX.value }],
			opacity: nextImageOpacity.value,
		};
	});

	// Animated style for third image
	const thirdImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: thirdImageTranslateX.value }],
			opacity: thirdImageOpacity.value,
		};
	});

	// Animated style for fourth image
	const fourthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: fourthImageTranslateX.value }],
			opacity: fourthImageOpacity.value,
		};
	});

	// Animated style for fifth image
	const fifthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: fifthImageTranslateX.value }],
			opacity: fifthImageOpacity.value,
		};
	});

	// Animated style for sixth image
	const sixthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: sixthImageTranslateX.value }],
			opacity: sixthImageOpacity.value,
		};
	});

	// Animated style for seventh image
	const seventhImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: seventhImageTranslateX.value }],
			opacity: seventhImageOpacity.value,
		};
	});

	// Animated style for eighth image
	const eighthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: eighthImageTranslateX.value }],
			opacity: eighthImageOpacity.value,
		};
	});

	// Animated style for ninth image
	const ninthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: ninthImageTranslateX.value }],
			opacity: ninthImageOpacity.value,
		};
	});

	// Animated style for tenth image
	const tenthImageAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: tenthImageTranslateX.value }],
			opacity: tenthImageOpacity.value,
		};
	});

	// Animated style for hero image
	const heroAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{ scale: heroScale.value },
				{ rotate: `${heroRotation.value}deg` }
			],
		};
	});

	// Animated style for title
	const titleAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: titleScale.value }],
			opacity: titleOpacity.value,
		};
	});

	// Animated style for tools
	const toolsAnimatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ scale: toolsScale.value }],
			opacity: toolsOpacity.value,
		};
	});

	// Animated style for glitter
	const glitterAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: glitterOpacity.value,
			transform: [
				{ scale: glitterScale.value },
				{ rotate: `${glitterRotation.value}deg` },
				{ translateX: glitterOrbitX.value },
				{ translateY: glitterOrbitY.value }
			],
		};
	});

	// Animated style for score
	const scoreAnimatedStyle = useAnimatedStyle(() => {
		const colorValue = scoreColor.value;
		let color = '#081082'; // Default blue color
		
		if (colorValue > 0) {
			color = '#00AA00'; // Green for positive
		} else if (colorValue < 0) {
			color = '#AA0000'; // Red for negative
		}
		
		return {
			transform: [{ scale: scoreScale.value }],
			color: color,
		};
	});

	return (
		<ThemedView style={styles.container}>
			<Stack.Screen options={{ headerShown: false }} />
			<View style={styles.card}>
				<Animated.View style={titleAnimatedStyle}>
					<ThemedText style={styles.title}> GERM BUSTER LAB 🦠 ⚔️</ThemedText>
				</Animated.View>
				
				{/* Score Display */}
				<Animated.View style={[styles.scoreContainer, scoreAnimatedStyle]}>
					<ThemedText style={styles.scoreText}>Score: {score}</ThemedText>
				</Animated.View>
				<Animated.View style={[styles.hero, heroAnimatedStyle]}>
					<Image
						source={require('../../assets/images/GermImageTree_HealthyKid.png')}
						style={{ width: '100%', height: '100%' }}
						contentFit="contain"
					/>
				</Animated.View>
				
				{/* Game Over Message */}
				{gameOver && (
					<View style={styles.gameOverContainer}>
						<ThemedText style={styles.gameOverText}>GAME OVER! 💀</ThemedText>
						<ThemedText style={styles.gameOverSubtext}>Wrong tool selected!</ThemedText>
					</View>
				)}

				{/* Game Complete Message */}
				{gameComplete && (
					<View style={styles.gameCompleteContainer}>
						{/* Individual glitter pieces with circular motion */}
						<Animated.View style={[styles.glitterPiece, { top: '10%', left: '10%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '20%', right: '15%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '30%', left: '20%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '40%', right: '25%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '50%', left: '30%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '60%', right: '35%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '70%', left: '40%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '80%', right: '45%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '15%', left: '50%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						<Animated.View style={[styles.glitterPiece, { top: '85%', left: '60%' }, glitterAnimatedStyle]}>
							<ThemedText style={styles.glitterText}>✨</ThemedText>
						</Animated.View>
						
						<ThemedText style={styles.gameCompleteText}>🎉 GAME COMPLETE! 🎉</ThemedText>
						<ThemedText style={styles.gameCompleteSubtext}>Great Job! Your Total Score: {score}</ThemedText>
					</View>
				)}

				{/* Current Image (Garbage Pile) */}
				{!showNextImage && !showThirdImage && !showSixthImage && (
					<Animated.View style={[styles.garbage, garbageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/GarbagePile.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Next Image (Dirty Tooth) */}
				{showNextImage && !showThirdImage && !showSixthImage && (
					<Animated.View style={[styles.garbage, nextImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/DirtyTooth.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Third Image (Coughing Kid) */}
				{showThirdImage && !showSixthImage && (
					<Animated.View style={[styles.garbage, thirdImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/Coughing Kid.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Sixth Image (Sanitize Hand) */}
				{showSixthImage && !showSeventhImage && (
					<Animated.View style={[styles.garbage, sixthImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/SanitizeHand_Image.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Seventh Image (Dirty Floor) */}
				{showSeventhImage && !showEighthImage && !showNinthImage && (
					<Animated.View style={[styles.garbage, seventhImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/Dirty_Floor_Image.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Eighth Image (Dirty Water Drinking Girl) */}
				{showEighthImage && !showNinthImage && (
					<Animated.View style={[styles.garbage, eighthImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/DirtyWaterDrinking_Girl_Copy.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Ninth Image (Dirty Body Kid) */}
				{showNinthImage && !showTenthImage && (
					<Animated.View style={[styles.garbage, ninthImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/DirtyBodyKid.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}

				{/* Tenth Image (Dirty Hands) */}
				{showTenthImage && (
					<Animated.View style={[styles.garbage, tenthImageAnimatedStyle]}>
						<Image
							source={require('../../assets/images/DirtyHands.png')}
							style={{ width: '100%', height: '100%' }}
							contentFit="contain"
						/>
					</Animated.View>
				)}
				<Animated.View style={[styles.toolsContainer, toolsAnimatedStyle]}>
					<View style={styles.toolsRow}>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('DustBin')}>
							<Image source={require('../../assets/images/DustBin.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('ToothBrush')}>
							<Image source={require('../../assets/images/ToothBrush.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('Broom')}>
							<Image source={require('../../assets/images/Broom.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('Soap')}>
							<Image source={require('../../assets/images/Soap.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
					</View>
					<View style={styles.toolsRow}>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('Sanitizer_Bottle')}>
							<Image source={require('../../assets/images/Sanitizer_Bottle.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('Filter_Water')}>
							<Image source={require('../../assets/images/Filter_Water.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('FaceMask')}>
							<Image source={require('../../assets/images/FaceMask.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.toolBox} onPress={() => handleToolClick('ShowerHead')}>
							<Image source={require('../../assets/images/ShowerHead.png')} style={styles.toolIcon} contentFit="contain" />
						</TouchableOpacity>
					</View>
				</Animated.View>
			</View>
			
			{/* Back Arrow Button - Only on Game Complete Screen - Outside Card Container */}
			{gameComplete && (
				<TouchableOpacity 
					style={styles.backButtonFinal} 
					onPress={() => router.push('/student/games-dashboard')}
					activeOpacity={0.7}
				>
					<ThemedText style={styles.backArrow}>←</ThemedText>
				</TouchableOpacity>
			)}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#B8D4FD',
		padding: 16,
	},
	card: {
		width: '100%',
		maxWidth: 380,
		height: '90%',
		backgroundColor: '#9EBEF5',
		borderRadius: 16,
		padding: 12,
		borderWidth: 2,
		borderColor: '#80A7EF',
	},
	title: {
		fontSize: 24,
		fontWeight: '900',
		textAlign: 'center',
		marginBottom: 8,
		color: '#081082',
	},
	hero: {
		width: '100%',
		aspectRatio: 1.3,
		marginTop: 28,
		alignSelf: 'flex-end',
		marginRight: 40,
	},
	garbage: {
		width: '65%',
		aspectRatio: 1.2,
		marginTop: 30,
		marginBottom: 12,
		alignSelf: 'center',
		position: 'relative',
		overflow: 'visible',
	},
	toolsContainer: {
		position: 'absolute',
		bottom: 12,
		left: 12,
		right: 12,
		gap: 8,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#9EBEF5',
		paddingVertical: 8,
		paddingHorizontal: 8,
	},
	toolsRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-around',
		gap: 4,
		width: '100%',
	},
	toolBox: {
		width: 70,
		height: 70,
		backgroundColor: '#fff',
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: '#e8e8e8',
		marginHorizontal: 0,
		marginVertical: 2,
		flex: 1,
	},
	toolIcon: {
		width: '80%',
		height: '80%',
	},
	gameOverContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -100 }, { translateY: -50 }],
		backgroundColor: 'rgba(255, 0, 0, 0.9)',
		padding: 20,
		borderRadius: 15,
		alignItems: 'center',
		zIndex: 1000,
	},
	gameOverText: {
		fontSize: 28,
		fontWeight: '900',
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 10,
	},
	gameOverSubtext: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	successContainer: {
		backgroundColor: 'rgba(0, 255, 0, 0.9)',
		padding: 20,
		borderRadius: 15,
		alignItems: 'center',
		width: '100%',
		height: '100%',
		justifyContent: 'center',
	},
	successText: {
		fontSize: 28,
		fontWeight: '900',
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 10,
	},
	successSubtext: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	gameCompleteContainer: {
		position: 'absolute',
		top: '50%',
		left: '50%',
		transform: [{ translateX: -150 }, { translateY: -100 }],
		backgroundColor: 'rgba(0, 255, 0, 0.9)',
		padding: 20,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		width: 300,
		zIndex: 1000,
	},
	gameCompleteText: {
		fontSize: 28,
		fontWeight: '900',
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 10,
	},
	gameCompleteSubtext: {
		fontSize: 16,
		fontWeight: '600',
		color: '#FFFFFF',
		textAlign: 'center',
	},
	glitterContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-around',
		alignItems: 'center',
		zIndex: 1001,
	},
	glitterText: {
		fontSize: 24,
		color: '#FFD700',
		textShadowColor: '#FFA500',
		textShadowOffset: { width: 1, height: 1 },
		textShadowRadius: 3,
	},
	glitterPiece: {
		position: 'absolute',
		zIndex: 1001,
	},
	scoreContainer: {
		position: 'absolute',
		top: 50,
		right: 10,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 20,
		borderWidth: 2,
		borderColor: '#081082',
		zIndex: 100,
	},
	scoreText: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#081082',
		textAlign: 'center',
	},
	backButtonFinal: {
		position: 'absolute',
		top: 0,
		left: 10,
		width: 50,
		height: 50,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderRadius: 25,
		borderWidth: 2,
		borderColor: '#081082',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1002,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	backArrow: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#081082',
		textAlign: 'center',
	},
});


