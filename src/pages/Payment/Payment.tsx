import React, { useState, useEffect } from 'react';
import { Button, Col, Input, Row, Typography, message, Spin, Modal } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleFilled } from '@ant-design/icons';
import './Payment.css';

const { Title, Text } = Typography;

interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
}

const priceDict: { [key: string]: number } = {
  'Consultation': 10000,
  'Follow-Up Visit': 16000,
  'Routine Check-Up': 9000,
  'Cluster Scheduling': 7000,
  'Personal Health Assessment': 20000,
};

const Payment = () => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<PaymentFormData>();
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentData = location.state?.appointmentData;
  
  const [loading, setLoading] = useState(false);
  const [paymentSum, setPaymentSum] = useState<number>(0);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  useEffect(() => {
    if (!appointmentData) {
      message.error('No appointment data found. Redirecting...');
      navigate('/appointment');
    } else {
      const appointmentType = appointmentData.appointmentType;
      const price = priceDict[appointmentType] || 0;
      setPaymentSum(price);
    }
  }, [appointmentData, navigate]);

  const cardNumberValue = watch('cardNumber');
  const getCardType = (): string => {
    if (!cardNumberValue) return '';
    const firstDigit = cardNumberValue.trim()[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    return '';
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!appointmentData) return; // Safe guard
    
    const currentYear = new Date().getFullYear();
    const expirationYear = parseInt(data.expirationYear, 10);
    
    if (expirationYear < currentYear) {
      message.error('Card has expired.');
      return;
    }

    setLoading(true);
    message.loading({ content: 'Processing payment...', key: 'paymentProcess' });

    try {
      const response = await axios.post(
        'http://127.0.0.1:5000/make_appointment', 
        appointmentData, 
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(appointmentData);
      setLoading(false);
      message.destroy('paymentProcess');

      if (response.status === 200 || response.status === 201) {
        // Show success modal with animation
        setIsSuccessModalVisible(true);
      } else {
        message.error('Failed to make appointment.');
      }
    } catch (error) {
      setLoading(false);
      message.destroy('paymentProcess');
      console.error('Error making appointment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleModalOk = () => {
    setIsSuccessModalVisible(false);
    navigate('/appointments');
  };

  return (
    <div className="payment-container">
      <Row justify="center" gutter={24} style={{ padding: '50px' }}>
        <Col xs={24} sm={24} md={8} lg={8}>
          <div className="payment-summary">
            <Title level={3}>Appointment Details</Title>
            {appointmentData && (
              <>
                <div className="detail-row">
                  <Text strong>Appointment Type:</Text>
                  <Text>{appointmentData.appointmentType}</Text>
                </div>
                <div className="detail-row">
                  <Text strong>Total Price:</Text>
                  <Text>{paymentSum} KZT</Text>
                </div>
              </>
            )}
          </div>
        </Col>
        <Col xs={24} sm={24} md={16} lg={12}>
          <Title level={2}>Payment Information</Title>
          <form onSubmit={handleSubmit(onSubmit)} className="payment-form">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className="form-item">
                  <label className="form-label">Card Number</label>
                  <div className="card-input-wrapper">
                    <Controller
                      name="cardNumber"
                      control={control}
                      rules={{ required: 'Please enter your card number' }}
                      render={({ field }) => <Input {...field} placeholder="XXXX XXXX XXXX XXXX" maxLength={19} />}
                    />
                    {getCardType() && (
                      <img 
                        className="card-icon" 
                        src={`/icons/${getCardType()}.png`} 
                        alt={getCardType()} 
                      />
                    )}
                  </div>
                  {errors.cardNumber && <span className="error-message">{errors.cardNumber.message}</span>}
                </div>
              </Col>

              <Col span={24}>
                <div className="form-item">
                  <label className="form-label">Card Holder</label>
                  <Controller
                    name="cardHolder"
                    control={control}
                    rules={{ required: 'Please enter the card holder name' }}
                    render={({ field }) => <Input {...field} placeholder="Name on Card" />}
                  />
                  {errors.cardHolder && <span className="error-message">{errors.cardHolder.message}</span>}
                </div>
              </Col>

              <Col span={12}>
                <div className="form-item">
                  <label className="form-label">Expiration Month</label>
                  <Controller
                    name="expirationMonth"
                    control={control}
                    rules={{ required: 'Please enter the expiration month' }}
                    render={({ field }) => <Input {...field} placeholder="MM" maxLength={2} />}
                  />
                  {errors.expirationMonth && <span className="error-message">{errors.expirationMonth.message}</span>}
                </div>
              </Col>

              <Col span={12}>
                <div className="form-item">
                  <label className="form-label">Expiration Year</label>
                  <Controller
                    name="expirationYear"
                    control={control}
                    rules={{ required: 'Please enter the expiration year' }}
                    render={({ field }) => <Input {...field} placeholder="YYYY" maxLength={4} />}
                  />
                  {errors.expirationYear && <span className="error-message">{errors.expirationYear.message}</span>}
                </div>
              </Col>

              <Col span={24}>
                <div className="form-item">
                  <label className="form-label">CVV</label>
                  <Controller
                    name="cvv"
                    control={control}
                    rules={{ required: 'Please enter the CVV' }}
                    render={({ field }) => <Input {...field} placeholder="XXX" maxLength={3} />}
                  />
                  {errors.cvv && <span className="error-message">{errors.cvv.message}</span>}
                </div>
              </Col>

              <Col span={24}>
                <Button type="primary" htmlType="submit" className="pay-button" disabled={loading}>
                  {loading ? <Spin /> : 'Pay'}
                </Button>
              </Col>
            </Row>
          </form>
        </Col>
      </Row>

      <Modal
        visible={isSuccessModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalOk}
        footer={[
          <Button key="ok" type="primary" onClick={handleModalOk}>
            OK
          </Button>
        ]}
      >
        <div className="success-modal-content">
          <div className="success-icon-wrapper">
            <CheckCircleFilled className="success-icon" />
          </div>
          <Title level={3}>Payment Successful!</Title>
          <Text>Your appointment has been successfully booked. We look forward to seeing you!</Text>
        </div>
      </Modal>
    </div>
  );
};

export default Payment;
