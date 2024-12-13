import React, { useState, useEffect } from 'react'; 
import { Button, Col, Input, Row, Typography, message, Spin, Modal } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircleFilled, ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf'; // Ensure jsPDF is installed
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
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<PaymentFormData>();
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentData = location.state?.appointmentData;
  
  const [loading, setLoading] = useState(false);
  const [paymentSum, setPaymentSum] = useState<number>(0);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    lastFourDigits: string;
    cardType: string;
    cardHolder: string;
    paymentAmount: number;
    dateTime: string;
  } | null>(null);

  useEffect(() => {
    if (!appointmentData) {
      message.error('No appointment data found. Redirecting...');
      navigate('/appointments');
    } else {
      const appointmentType = appointmentData.appointmentType;
      const price = priceDict[appointmentType] || 0;
      setPaymentSum(price);
    }
  }, [appointmentData, navigate]);

  // Watch card number to determine card type
  const cardNumberValue = watch('cardNumber');
  const getCardType = (): string => {
    if (!cardNumberValue) return '';
    const firstDigit = cardNumberValue.trim()[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    return 'unknown';
  };

  // Handle Receipt Printing
const handlePrintReceipt = () => {
  if (!receiptData) return;

  const doc = new jsPDF();

  // Add the logo at the top
  const logoUrl = 'https://raw.githubusercontent.com/mukhametzhan-dev/reactfront-serv/refs/heads/main/public/icons/logo.png';
  doc.addImage(logoUrl, 'PNG', 10, 10, 40, 40); // Adjust the size and position of the logo

  // Title of the receipt
  doc.setFontSize(18);
  doc.text('Payment Receipt', 105, 30, { align: 'center' });

  // Add a separator line
  doc.setLineWidth(0.5);
  doc.line(10, 40, 200, 40); // Draw a horizontal line below the title

  // Set font for receipt details
  doc.setFontSize(12);
  doc.text(`Card Holder: ${receiptData.cardHolder}`, 20, 50);
  doc.text(`Card Type: ${receiptData.cardType}`, 20, 60);
  doc.text(`Card Number: **** **** **** ${receiptData.lastFourDigits}`, 20, 70);
  doc.text(`Payment Amount: ${receiptData.paymentAmount} KZT`, 20, 80);
  doc.text(`Date & Time: ${receiptData.dateTime}`, 20, 90);

  // Add a footer
  doc.setFontSize(10);
  doc.text('Thank you for your payment!', 105, 120, { align: 'center' });

  // Save the PDF
  doc.save('receipt.pdf');
};


  const onSubmit = async (data: PaymentFormData) => {
    if (!appointmentData) return; // Safe guard
    
    // Numeric Validation
    const cardNumberValid = /^\d{16}$/.test(data.cardNumber.replace(/\s+/g, ''));
    const expirationMonthValid = /^(0[1-9]|1[0-2])$/.test(data.expirationMonth);
    const currentYear = new Date().getFullYear();
    const expirationYear = parseInt(data.expirationYear, 10);
    const cvvValid = /^\d{3}$/.test(data.cvv);

    if (!cardNumberValid) {
      message.error('Card number must be 16 digits.');
      return;
    }

    if (!expirationMonthValid) {
      message.error('Expiration month must be between 01 and 12.');
      return;
    }

    if (isNaN(expirationYear) || expirationYear < currentYear) {
      message.error('Card has expired. Please check the expiration year.');
      return;
    }

    if (!cvvValid) {
      message.error('CVV must be 3 digits.');
      return;
    }

    setLoading(true);
    message.loading({ content: 'Processing payment...', key: 'paymentProcess' });

    // try {
    //   const response = await axios.post(
    //     'http://127.0.0.1:5000/make_appointment', 
    //     appointmentData, 
    //     { headers: { 'Content-Type': 'application/json' } }
    //   );
    try {
      const response = await axios.post(
        'https://happymed.work.gd/make_appointment', // Changed endpoint to make_payment
        {
          ...appointmentData,
          // paymentSum,
          // cardDetails: {
          //   cardNumber: data.cardNumber,
          //   cardHolder: data.cardHolder,
          //   expirationMonth: data.expirationMonth,
          //   expirationYear: data.expirationYear,
          //   cvv: data.cvv,
          //   cardType: getCardType(),
          // }
        }, 
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log(appointmentData);
      setLoading(false);
      message.destroy('paymentProcess');

      if (response.status === 200 || response.status === 201) {
        // Prepare receipt data
        const lastFourDigits = data.cardNumber.slice(-4);
        const cardType = getCardType().toUpperCase();
        const cardHolder = data.cardHolder;
        const paymentAmount = paymentSum;
        const dateTime = new Date().toLocaleString();

        setReceiptData({
          lastFourDigits,
          cardType,
          cardHolder,
          paymentAmount,
          dateTime,
        });

        // Show success modal with animation
        setIsSuccessModalVisible(true);
      } else {
        message.error('Failed to process payment.');
      }
    } catch (error) {
      setLoading(false);
      message.destroy('paymentProcess');
      console.error('Error processing payment:', error);
      message.error('An unexpected error occurred.');
    }
  };

  const handleModalOk = () => {
    setIsSuccessModalVisible(false);
    navigate('/appointments');
  };

  const handleBack = () => {
    navigate('/appointments');
  };

  return (
    <div className="payment-container">
      <Row justify="center" gutter={24} className="payment-row">
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
          <div className="form-header">
            <Title level={2}>Payment Information</Title>
            <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="back-button"
            >
              Back to Appointments
            </Button>
          </div>
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
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="XXXX XXXX XXXX XXXX"
                          maxLength={19}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                            const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setValue('cardNumber', formattedValue);
                          }}
                        />
                      )}
                    />
                    {getCardType() !== 'unknown' && getCardType() && (
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
                    rules={{ 
                      required: 'Please enter the expiration month',
                      pattern: {
                        value: /^(0[1-9]|1[0-2])$/,
                        message: 'Enter a valid month (01-12)'
                      }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="MM"
                        maxLength={2}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                          setValue('expirationMonth', value);
                        }}
                      />
                    )}
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
                    rules={{ 
                      required: 'Please enter the expiration year',
                      pattern: {
                        value: /^\d{4}$/,
                        message: 'Enter a valid year (YYYY)'
                      }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="YYYY"
                        maxLength={4}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setValue('expirationYear', value);
                        }}
                      />
                    )}
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
                    rules={{ 
                      required: 'Please enter the CVV',
                      pattern: {
                        value: /^\d{3}$/,
                        message: 'CVV must be 3 digits'
                      }
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="XXX"
                        maxLength={3}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setValue('cvv', value);
                        }}
                      />
                    )}
                  />
                  {errors.cvv && <span className="error-message">{errors.cvv.message}</span>}
                </div>
              </Col>

              <Col span={24}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  className="pay-button" 
                  disabled={loading}
                >
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
          receiptData && (
            <Button 
              key="print" 
              onClick={handlePrintReceipt} 
              icon={<PrinterOutlined />}
            >
              Print Receipt
            </Button>
          ),
          <Button key="ok" type="primary" onClick={handleModalOk}>
            OK
          </Button>
        ]}
        className="success-modal"
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
