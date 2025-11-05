import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LibraryScreen from './src/screens/LibraryScreen';
import ReaderScreen from './src/screens/ReaderScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Library"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Library"
          component={LibraryScreen}
          options={{ title: 'My Library' }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ title: 'Reader' }}
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
