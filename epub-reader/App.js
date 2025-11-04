import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LibraryScreen from './src/screens/LibraryScreen';
import ReaderScreen from './src/screens/ReaderScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
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
    </NavigationContainer>
  );
};

export default App;
