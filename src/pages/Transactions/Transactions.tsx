import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Row, Col, Card, Typography, List, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, DollarCircleOutlined } from '@ant-design/icons';
import './Transactions.css';

const { Title, Text } = Typography;

interface Transaction {
  date: string;
  price: number;
  status: string;
}

const Transactions = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const fetchBalance = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const response = await axios.get(`http://happymedkz.serveo.net/get_balance`, {
          params: { email: parsedUser.email },
        });
        if (response.status === 200) {
          setBalance(response.data.balance);
        } else {
          message.error('Failed to fetch balance.');
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        message.error('An unexpected error occurred.');
      }
    }
  };

  const fetchTransactions = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        const response = await axios.get(`http://happymedkz.serveo.net/get_transactions`, {
          params: { patient_id: parsedUser.patient_id },
        });
        if (response.status === 200) {
          setTransactions(response.data.transactions);
        } else {
          message.error('Failed to fetch transactions.');
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        message.error('An unexpected error occurred.');
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'booked':
        return <CheckCircleOutlined style={{ color: 'green' }} />;
      case 'canceled':
        return <CloseCircleOutlined style={{ color: 'red' }} />;
      case 'canceledP':
        return <ExclamationCircleOutlined style={{ color: 'orange' }} />;
      default:
        return <DollarCircleOutlined style={{ color: 'blue' }} />;
    }
  };

  return (
    <Row justify="center" className="transactions-container">
      <Col xs={24} sm={24} md={20} lg={18}>
        <Title level={2}>Transactions</Title>
        <Card className="balance-card">
          <Title level={4}>Balance: {balance} KZT</Title>
          {balance < 0 && (
            <Text type="danger">You have penalties so you can't cancel any appointments.</Text>
          )}
        </Card>
        <Card className="transactions-card">
          <Title level={4}>Transaction History</Title>
          <List
            itemLayout="horizontal"
            dataSource={transactions}
            renderItem={(transaction) => (
              <List.Item>
                <List.Item.Meta
                  avatar={getStatusIcon(transaction.status)}
                  title={`Date: ${transaction.date}`}
                  description={`Price: ${transaction.price} KZT`}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default Transactions;
