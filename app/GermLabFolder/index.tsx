import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function PreGameScreen() {
	const colorScheme = useColorScheme();

	return (
		<ThemedView style={styles.container}>
			<Stack.Screen options={{ headerShown: false }} />
			<View style={styles.content}>
				{/* Top greeting header */}
				<View style={styles.headerRow}>
					<Image
						source={require('../../assets/images/GermLabImageTwo.png')}
						style={styles.avatar}
						contentFit="cover"
					/>
					<View style={styles.headerTextCol}>
						<ThemedText style={styles.greetingTitle}>Hi , Vinuji Fernando !!!</ThemedText>
						<ThemedText style={styles.greetingSubtitle}>Welcome to Sanity Quest !</ThemedText>
						<ThemedText style={styles.scheduleText}>Daily Schedule : 2:00 PM - 8:30 PM</ThemedText>
					</View>
					<Image
						source={require('../../assets/images/notification_Image.png')}
						style={styles.notificationIcon}
						contentFit="contain"
					/>
				</View>

				<ThemedText style={styles.bigHeading}>Click Proceed  Button</ThemedText>

				<Image
					source={require('../../assets/images/GermLabImageOne.png')}
					style={styles.image}
					contentFit="cover"
				/>
					<Pressable
					accessibilityRole="button"
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: '#0A3AAB', opacity: pressed ? 0.85 : 1 },
					]}
						onPress={() => router.push('/GermLabFolder/game')}
				>
					<ThemedText type="defaultSemiBold" style={styles.buttonText}>Proceed</ThemedText>
				</Pressable>
			</View>

			{/* Bottom nav bar */}
			{/* <View style={styles.bottomNav}>
				<Pressable style={styles.navItem} accessibilityRole="button" onPress={() => {}}>
					<IconSymbol size={28} name="house.fill" color={'#0A3AAB'} />
					<ThemedText style={styles.navLabel}>Home</ThemedText>
				</Pressable>
				<Pressable style={styles.navItem} accessibilityRole="button" onPress={() => {}}>
					<IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={'#1a1a1a'} />
					<ThemedText style={styles.navLabel}>Progress</ThemedText>
				</Pressable>
				<Pressable style={styles.navItem} accessibilityRole="button" onPress={() => {}}>
					<IconSymbol size={28} name="gearshape" color={'#1a1a1a'} />
					<ThemedText style={styles.navLabel}>Settings</ThemedText>
				</Pressable>
			</View> */}
		</ThemedView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
		backgroundColor: '#B8D4FD',
	},
	content: {
		gap: 16,
		width: '100%',
		maxWidth: 420,
		alignItems: 'center',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
		gap: 12,
		marginTop: -84,
	},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#fff',
		marginTop: -48,
	},
	headerTextCol: {
		flex: 1,
		gap: 2,
		marginTop: -30,
	},
	greetingTitle: {
		fontWeight: '800',
		fontSize: 16,
		color: '#000',
	},
	greetingSubtitle: {
		fontSize: 13,
		opacity: 0.9,
		color: '#000',
	},
	scheduleText: {
		fontSize: 12,
		opacity: 0.8,
		color: '#000',
	},
	bigHeading: {
		width: '100%',
		fontSize: 26,
		fontWeight: '900',
		textAlign: 'left',
		marginTop: 8,
		fontFamily: Fonts.rounded,
		color: '#0A3AAB',
	},
	button: {
		marginTop: 8,
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 12,
		width: '50%',
		alignItems: 'center',
		elevation: 2,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 4 },
	},
	buttonText: {
		color: '#fff',
	},
	image: {
		width: '100%',
		aspectRatio: 1,
		borderRadius: 20,
		marginVertical: 4,
		elevation: 3,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 12,
		shadowOffset: { width: 0, height: 6 },
	},
	bottomNav: {
		position: 'absolute',
		left: 24,
		right: 24,
		bottom: 24,
		backgroundColor: '#fff',
		borderRadius: 28,
		paddingVertical: 12,
		paddingHorizontal: 16,
		flexDirection: 'row',
		justifyContent: 'space-around',
		alignItems: 'center',
		elevation: 6,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 14,
		shadowOffset: { width: 0, height: 8 },
	},
	navItem: {
		alignItems: 'center',
		gap: 4,
		minWidth: 80,
	},
	navLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: '#1A1A1A',
	},
	notificationIcon: {
		width: 64,
		height: 64,
		marginLeft: 8,
		marginTop: -48,
	},
});


