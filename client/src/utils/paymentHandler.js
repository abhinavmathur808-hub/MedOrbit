

const API_URL = 'http://localhost:5000/api/payment';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const handlePayment = async (amount, userDetails, appointmentDetails, onSuccess, onError, token, doctorId) => {

    try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error('Failed to load Razorpay SDK');
        }

        const keyResponse = await fetch(`${API_URL}/getkey`);
        const keyData = await keyResponse.json();

        if (!keyData.success || !keyData.key || keyData.key === 'undefined') {
            throw new Error('Payment configuration error — Razorpay key is missing. Check your server .env file.');
        }

        const rzpKey = keyData.key;

        const orderResponse = await fetch(`${API_URL}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ amount, doctorId }),
        });

        const orderData = await orderResponse.json();

        if (!orderResponse.ok || !orderData.success) {
            throw new Error(orderData.message || `Checkout failed with status ${orderResponse.status}`);
        }

        const options = {
            key: rzpKey,
            amount: Math.round(orderData.order.amount),
            currency: orderData.order.currency || 'INR',
            name: 'MedOrbit',
            description: 'Appointment Booking Fee',
            order_id: orderData.order.id,
            handler: async function (response) {

                try {
                    const verifyResponse = await fetch(`${API_URL}/paymentVerification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            doctorName: appointmentDetails?.doctorName || '',
                            appointmentDate: appointmentDetails?.date || '',
                            appointmentTime: appointmentDetails?.time || '',
                            amount: amount,
                            userEmail: userDetails?.email || '',
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        onSuccess(verifyData);
                    } else {
                        throw new Error('Payment verification failed');
                    }
                } catch (error) {
                    onError(error);
                }
            },
            prefill: {
                name: userDetails?.name || 'Test Patient',
                email: userDetails?.email || 'test@medorbit.com',
                contact: userDetails?.phone || '9999999999',
            },
            theme: {
                color: '#E11D48', // Rose-600
            },
            modal: {
                ondismiss: function () {
                },
            },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
            onError(new Error(response.error.description));
        });

        razorpay.open();
    } catch (error) {
        onError(error);
    }
};

export default handlePayment;
