import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    StatusBar,
    Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import api from '../services/api';

const serviceTypeLabels: Record<string, { label: string; icon: string; color: string }> = {
    'wash-fold': { label: 'Wash & Fold', icon: '👕', color: '#06b6d4' },
    'dry-cleaning': { label: 'Dry Cleaning', icon: '👔', color: '#8b5cf6' },
    'ironing': { label: 'Ironing', icon: '♨️', color: '#f59e0b' },
    'express': { label: 'Express', icon: '⚡', color: '#ef4444' },
    'bulk-commercial': { label: 'Bulk Commercial', icon: '🏭', color: '#22c55e' },
};

interface ServiceItem {
    _id: string;
    name: string;
    serviceType: string;
    pricePerUnit: number;
    unit: string;
    description?: string;
}

interface CartItem {
    serviceId: string;
    service: ServiceItem;
    quantity: number;
}

export default function CreateOrderScreen({ navigation }: any) {
    const [services, setServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastOrderId, setLastOrderId] = useState('');


    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await api.get('/customer-portal/services');
            if (res.data.data && res.data.data.length > 0) {
                setServices(res.data.data);
            } else {
                setServices(FALLBACK_SERVICES);
            }
        } catch (err) {
            console.error('Failed to load services:', err);
            setServices(FALLBACK_SERVICES);
        } finally {
            setLoading(false);
        }
    };

    const FALLBACK_SERVICES: ServiceItem[] = [
        { _id: 'f1', name: 'Premium Wash & Fold', serviceType: 'wash-fold', pricePerUnit: 120, unit: 'kg', description: 'Complete cleaning, drying, and professional folding for your everyday wear.' },
        { _id: 'f2', name: 'Business Shirt Dry Clean', serviceType: 'dry-cleaning', pricePerUnit: 80, unit: 'pcs', description: 'Premium dry cleaning and starching for a crisp, professional look.' },
        { _id: 'f3', name: 'Suit Dry Cleaning', serviceType: 'dry-cleaning', pricePerUnit: 350, unit: 'set', description: 'Careful dry cleaning for blazers and trousers using premium solvents.' },
        { _id: 'f4', name: 'Standard Ironing', serviceType: 'ironing', pricePerUnit: 15, unit: 'pcs', description: 'Steam ironing for wrinkle-free clothes delivered on hangers.' },
        { _id: 'f5', name: 'Same Day Express Service', serviceType: 'express', pricePerUnit: 500, unit: 'order', description: 'Priority processing for your urgent laundry needs. Delivery within 8-12 hours.' },
        { _id: 'f6', name: 'Curtain Dry Cleaning', serviceType: 'dry-cleaning', pricePerUnit: 450, unit: 'pair', description: 'Deep cleaning for heavy curtains to remove dust and allergens.' },
    ];


    const addToCart = (service: ServiceItem) => {
        const existing = cart.find(c => c.serviceId === service._id);
        if (existing) {
            setCart(cart.map(c =>
                c.serviceId === service._id ? { ...c, quantity: c.quantity + 1 } : c
            ));
        } else {
            setCart([...cart, { serviceId: service._id, service, quantity: 1 }]);
        }
    };

    const updateQuantity = (serviceId: string, delta: number) => {
        setCart(cart.map(c => {
            if (c.serviceId === serviceId) {
                const newQty = c.quantity + delta;
                return newQty > 0 ? { ...c, quantity: newQty } : c;
            }
            return c;
        }).filter(c => c.quantity > 0));
    };

    const removeFromCart = (serviceId: string) => {
        setCart(cart.filter(c => c.serviceId !== serviceId));
    };

    const getCartTotal = () => cart.reduce((sum, c) => sum + (c.service.pricePerUnit * c.quantity), 0);
    const getCartCount = () => cart.reduce((sum, c) => sum + c.quantity, 0);

    const placeOrder = async () => {
        if (cart.length === 0) {
            Alert.alert('Empty Cart', 'Please add at least one service to your order');
            return;
        }

        setSubmitting(true);
        try {
            const items = cart.map(c => ({
                serviceId: c.serviceId,
                quantity: c.quantity,
            }));

            const res = await api.post('/customer-portal/orders', {
                items,
                specialInstructions: specialInstructions.trim() || undefined,
            });

            setLastOrderId(res.data.data.orderId || 'PENDING');
            setCart([]);
            setSpecialInstructions('');
            setShowCart(false);
            setShowSuccess(true);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
        } finally {
            setSubmitting(false);
        }
    };


    // Group services by type
    const grouped = services.reduce<Record<string, ServiceItem[]>>((acc, s) => {
        if (!acc[s.serviceType]) acc[s.serviceType] = [];
        acc[s.serviceType].push(s);
        return acc;
    }, {});

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <ActivityIndicator size="large" color="#06b6d4" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 20,
                    paddingTop: 56,
                    paddingBottom: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: '#1e293b',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                        borderWidth: 1,
                        borderColor: '#334155',
                    }}
                >
                    <Text style={{ color: '#06b6d4', fontSize: 18, fontWeight: '700' }}>←</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#f1f5f9' }}>New Order</Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Choose services to order</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {Object.entries(grouped).map(([type, items]) => {
                    const typeInfo = serviceTypeLabels[type] || { label: type, icon: '📋', color: '#94a3b8' };

                    return (
                        <View key={type} style={{ marginBottom: 20 }}>
                            {/* Section Header */}
                            <View style={{ paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 20 }}>{typeInfo.icon}</Text>
                                <Text style={{ color: typeInfo.color, fontSize: 16, fontWeight: '700' }}>
                                    {typeInfo.label}
                                </Text>
                            </View>

                            {/* Service Cards */}
                            {items.map(service => {
                                const inCart = cart.find(c => c.serviceId === service._id);

                                return (
                                    <View
                                        key={service._id}
                                        style={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: 16,
                                            padding: 16,
                                            marginHorizontal: 20,
                                            marginBottom: 8,
                                            borderWidth: 1,
                                            borderColor: inCart ? typeInfo.color : '#334155',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600' }}>
                                                    {service.name}
                                                </Text>
                                                {service.description ? (
                                                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                                                        {service.description}
                                                    </Text>
                                                ) : null}
                                                <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                                                    ${service.pricePerUnit} / {service.unit}
                                                </Text>
                                            </View>

                                            {inCart ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <TouchableOpacity
                                                        onPress={() => updateQuantity(service._id, -1)}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 10,
                                                            backgroundColor: '#0f172a',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderWidth: 1,
                                                            borderColor: '#334155',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '700' }}>−</Text>
                                                    </TouchableOpacity>
                                                    <Text style={{ color: '#f1f5f9', fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' }}>
                                                        {inCart.quantity}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() => updateQuantity(service._id, 1)}
                                                        style={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: 10,
                                                            backgroundColor: '#06b6d4',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => addToCart(service)}
                                                    style={{
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 8,
                                                        borderRadius: 10,
                                                        backgroundColor: '#06b6d4',
                                                    }}
                                                >
                                                    <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700' }}>Add</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 }}>
                    <TouchableOpacity onPress={() => setShowCart(true)} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#06b6d4', '#0284c7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                borderRadius: 16,
                                padding: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{getCartCount()}</Text>
                                </View>
                                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>View Cart</Text>
                            </View>
                            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }}>${getCartTotal()}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            {/* Cart Modal */}
            <Modal visible={showCart} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                    <View
                        style={{
                            backgroundColor: '#0f172a',
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            padding: 20,
                            maxHeight: '85%',
                        }}
                    >
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Text style={{ color: '#f1f5f9', fontSize: 20, fontWeight: '800' }}>Your Cart</Text>
                            <TouchableOpacity onPress={() => setShowCart(false)}>
                                <Text style={{ color: '#64748b', fontSize: 24 }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Cart Items */}
                            {cart.map(item => (
                                <View
                                    key={item.serviceId}
                                    style={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: 16,
                                        padding: 14,
                                        marginBottom: 8,
                                        borderWidth: 1,
                                        borderColor: '#334155',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '600' }}>{item.service.name}</Text>
                                            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                                                ${item.service.pricePerUnit} × {item.quantity} {item.service.unit}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '700' }}>
                                                ${item.service.pricePerUnit * item.quantity}
                                            </Text>
                                            <TouchableOpacity onPress={() => removeFromCart(item.serviceId)} style={{ marginTop: 4 }}>
                                                <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>Remove</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Quantity controls */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (item.quantity <= 1) removeFromCart(item.serviceId);
                                                else updateQuantity(item.serviceId, -1);
                                            }}
                                            style={{
                                                width: 30, height: 30, borderRadius: 8,
                                                backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center',
                                                borderWidth: 1, borderColor: '#334155',
                                            }}
                                        >
                                            <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700' }}>−</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>
                                            {item.quantity}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => updateQuantity(item.serviceId, 1)}
                                            style={{
                                                width: 30, height: 30, borderRadius: 8,
                                                backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center',
                                            }}
                                        >
                                            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            {/* Special Instructions */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 }}>
                                    SPECIAL INSTRUCTIONS (OPTIONAL)
                                </Text>
                                <TextInput
                                    style={{
                                        backgroundColor: '#1e293b',
                                        borderRadius: 14,
                                        padding: 14,
                                        color: '#f1f5f9',
                                        fontSize: 14,
                                        minHeight: 80,
                                        textAlignVertical: 'top',
                                        borderWidth: 1,
                                        borderColor: '#334155',
                                    }}
                                    placeholder="E.g., please handle with care, starch shirts etc."
                                    placeholderTextColor="#475569"
                                    value={specialInstructions}
                                    onChangeText={setSpecialInstructions}
                                    multiline
                                />
                            </View>

                            {/* Payment Method */}
                            <View style={{ marginTop: 24, marginBottom: 8 }}>
                                <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 }}>
                                    PAYMENT METHOD
                                </Text>
                                <View
                                    style={{
                                        backgroundColor: '#0f172a',
                                        borderRadius: 16,
                                        padding: 16,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 14,
                                        borderWidth: 1,
                                        borderColor: '#06b6d4',
                                    }}
                                >
                                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(6, 182, 212, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ fontSize: 22 }}>💵</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ color: '#64748b', fontSize: 15, fontWeight: '700' }}>Pay Offline</Text>
                                        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Pay via Cash at delivery</Text>
                                    </View>
                                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center' }}>
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Total Summary */}
                            <View
                                style={{
                                    backgroundColor: '#1e293b',
                                    borderRadius: 16,
                                    padding: 16,
                                    marginTop: 16,
                                    borderWidth: 1,
                                    borderColor: '#334155',
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ color: '#64748b', fontSize: 14 }}>Items</Text>
                                    <Text style={{ color: '#94a3b8', fontSize: 14 }}>{getCartCount()}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' }}>
                                    <Text style={{ color: '#f1f5f9', fontSize: 18, fontWeight: '800' }}>Total</Text>
                                    <Text style={{ color: '#06b6d4', fontSize: 18, fontWeight: '800' }}>${getCartTotal()}</Text>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Place Order Button */}
                        <TouchableOpacity onPress={placeOrder} disabled={submitting} activeOpacity={0.8} style={{ marginTop: 24, marginBottom: 8 }}>
                            <LinearGradient
                                colors={submitting ? ['#475569', '#475569'] : ['#06b6d4', '#0284c7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16, letterSpacing: 0.5 }}>
                                    {submitting ? 'Placing Order...' : 'Confirm Order — Pay Offline'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal visible={showSuccess} animationType="fade" transparent>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 24 }}>
                    <View
                        style={{
                            backgroundColor: '#1e293b',
                            borderRadius: 32,
                            padding: 32,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#334155',
                        }}
                    >
                        <LinearGradient
                            colors={['#22c55e', '#15803d']}
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 24,
                                shadowColor: '#22c55e',
                                shadowOffset: { width: 0, height: 10 },
                                shadowOpacity: 0.3,
                                shadowRadius: 20,
                                elevation: 10,
                            }}
                        >
                            <Text style={{ fontSize: 40, color: '#fff' }}>✓</Text>
                        </LinearGradient>

                        <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
                            Order Placed!
                        </Text>
                        <Text style={{ color: '#94a3b8', fontSize: 16, marginTop: 8, textAlign: 'center' }}>
                            Order ID: <Text style={{ color: '#06b6d4', fontWeight: '700' }}>#{lastOrderId}</Text>
                        </Text>

                        <View style={{ width: '100%', backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginTop: 24, borderWidth: 1, borderColor: '#334155' }}>
                            <Text style={{ color: '#f1f5f9', fontSize: 14, fontWeight: '700', marginBottom: 12 }}>WHAT HAPPENS NEXT?</Text>
                            
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Text style={{ fontSize: 18 }}>🎒</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>Our partner will pick up your items within 24 hours.</Text>
                            </View>
                            
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                                <Text style={{ fontSize: 18 }}>🫧</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>Items will be washed, ironed and packed with care.</Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <Text style={{ fontSize: 18 }}>💵</Text>
                                <Text style={{ color: '#94a3b8', fontSize: 13, flex: 1 }}>Pay offline via Cash at the time of delivery.</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowSuccess(false);
                                navigation.goBack();
                                // We don't need navigation.navigate('Orders') because we goBack to Home first usually, 
                                // but the user might expect to see orders. 
                                // Actually goBack is safer here.
                            }}
                            activeOpacity={0.8}
                            style={{ marginTop: 32, width: '100%' }}
                        >
                            <LinearGradient
                                colors={['#06b6d4', '#0284c7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{
                                    paddingVertical: 16,
                                    borderRadius: 16,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>
                                    Back to Home
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => { setShowSuccess(false); navigation.goBack(); }} style={{ marginTop: 16 }}>
                            <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '600' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

