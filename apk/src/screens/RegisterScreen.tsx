import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';

const InputField = ({ icon, label, value, onChangeText, placeholder, ...props }: any) => (
    <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.5 }}>
            {label}
        </Text>
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#0f172a',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: '#334155',
            }}
        >
            <Text style={{ fontSize: 18, marginRight: 10, color: '#64748b' }}>{icon}</Text>
            <TextInput
                style={{ flex: 1, color: '#f1f5f9', fontSize: 16 }}
                placeholder={placeholder}
                placeholderTextColor="#475569"
                value={value}
                onChangeText={onChangeText}
                {...props}
            />
        </View>
    </View>
);

export default function RegisterScreen({ navigation }: any) {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        if (!name || !phone || !password) {
            Alert.alert('Error', 'Name, phone, and password are required');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            await register({ name, phone, email, address, password });
        } catch (err: any) {
            Alert.alert('Registration Failed', err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={{ paddingHorizontal: 24, paddingVertical: 40 }}>
                        {/* Header */}
                        <View style={{ alignItems: 'center', marginBottom: 32 }}>
                            <View
                                style={{
                                    width: 240,
                                    height: 90,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    backgroundColor: '#ffffff',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 5,
                                    overflow: 'hidden',
                                }}
                            >
                                <Image
                                    source={require('../../public/logo.png')}
                                    style={{ width: 220, height: 70 }}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff' }}>
                                Peninsula Laundries
                            </Text>
                            <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                                Create your account
                            </Text>
                        </View>

                        {/* Form Card */}
                        <View
                            style={{
                                backgroundColor: '#1e293b',
                                borderRadius: 24,
                                padding: 24,
                                borderWidth: 1,
                                borderColor: '#334155',
                            }}
                        >
                            <Text style={{ fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 4 }}>
                                Register
                            </Text>
                            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                                Fill in your details to get started
                            </Text>

                            <InputField icon="👤" label="FULL NAME *" value={name} onChangeText={setName} placeholder="Enter your name" />
                            <InputField icon="📱" label="PHONE NUMBER *" value={phone} onChangeText={setPhone} placeholder="Enter phone number" keyboardType="phone-pad" />
                            <InputField icon="✉️" label="EMAIL (OPTIONAL)" value={email} onChangeText={setEmail} placeholder="Enter email" keyboardType="email-address" autoCapitalize="none" />
                            <InputField icon="📍" label="ADDRESS (OPTIONAL)" value={address} onChangeText={setAddress} placeholder="Enter address" />
                            <InputField icon="🔒" label="PASSWORD *" value={password} onChangeText={setPassword} placeholder="Min 6 characters" secureTextEntry />
                            <InputField icon="🔒" label="CONFIRM PASSWORD *" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry />

                            {/* Register Button */}
                            <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={isLoading ? ['#475569', '#475569'] : ['#06b6d4', '#0284c7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 16,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        {/* Login Link */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
                            <Text style={{ color: '#64748b', fontSize: 14 }}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.goBack()}>
                                <Text style={{ color: '#06b6d4', fontSize: 14, fontWeight: '700' }}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
