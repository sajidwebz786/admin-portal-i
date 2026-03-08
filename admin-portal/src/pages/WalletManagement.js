import React, { useState, useEffect } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormInput,
  CFormLabel,
  CBadge,
  CSpinner,
  CPagination,
  CWidgetStatsA,
} from '@coreui/react';
import { cilWallet, cilArrowThickRight, cilPlus, cilSearch, cilHistory } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { walletService } from '../services/api';

const WalletManagement = () => {
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ userId: '', credits: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({ limit: 20, offset: 0, totalCount: 0 });
  const [transactionPagination, setTransactionPagination] = useState({ limit: 50, offset: 0, totalCount: 0 });
  const [activeTab, setActiveTab] = useState('wallets');

  useEffect(() => {
    fetchWallets();
    fetchStats();
  }, [pagination.limit, pagination.offset]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
  }, [activeTab, transactionPagination.limit, transactionPagination.offset]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const response = await walletService.getAllWallets({
        limit: pagination.limit,
        offset: pagination.offset,
      });
      setWallets(response.data.wallets);
      setPagination((prev) => ({ ...prev, totalCount: response.data.totalCount }));
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await walletService.getAllTransactions({
        limit: transactionPagination.limit,
        offset: transactionPagination.offset,
      });
      setTransactions(response.data.transactions);
      setTransactionPagination((prev) => ({ ...prev, totalCount: response.data.totalCount }));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await walletService.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewWallet = async (wallet) => {
    try {
      setLoading(true);
      const response = await walletService.getWalletByUser(wallet.userId);
      setSelectedWallet(response.data.wallet);
      setSelectedUser(wallet.User);
      setTransactions(response.data.transactions);
      setShowTransactionModal(true);
    } catch (error) {
      console.error('Error fetching wallet details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.userId) errors.userId = 'User ID is required';
    if (!formData.credits || parseFloat(formData.credits) <= 0) {
      errors.credits = 'Valid credits amount is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await walletService.addCredits({
        userId: parseInt(formData.userId),
        credits: parseFloat(formData.credits),
        description: formData.description,
      });
      setShowAddModal(false);
      setFormData({ userId: '', credits: '', description: '' });
      setFormErrors({});
      fetchWallets();
      fetchStats();
      alert('Credits added successfully!');
    } catch (error) {
      console.error('Error adding credits:', error);
      alert(error.response?.data?.message || 'Failed to add credits');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const getTransactionTypeBadge = (type) => {
    const badges = {
      credit_purchase: { color: 'success', text: 'Credit Purchase' },
      reward: { color: 'info', text: 'Reward' },
      deduction: { color: 'warning', text: 'Deduction' },
      refund: { color: 'primary', text: 'Refund' },
    };
    const badge = badges[type] || { color: 'secondary', text: type };
    return <CBadge color={badge.color}>{badge.text}</CBadge>;
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: 'success', text: 'Completed' },
      pending: { color: 'warning', text: 'Pending' },
      failed: { color: 'danger', text: 'Failed' },
    };
    const badge = badges[status] || { color: 'secondary', text: status };
    return <CBadge color={badge.color}>{badge.text}</CBadge>;
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.totalCount / pagination.limit);
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

    return (
      <CPagination
        align="end"
        activePage={currentPage}
        pages={totalPages}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, offset: (page - 1) * prev.limit }))}
      />
    );
  };

  const renderTransactionPagination = () => {
    const totalPages = Math.ceil(transactionPagination.totalCount / transactionPagination.limit);
    const currentPage = Math.floor(transactionPagination.offset / transactionPagination.limit) + 1;

    return (
      <CPagination
        align="end"
        activePage={currentPage}
        pages={totalPages}
        onPageChange={(page) => setTransactionPagination((prev) => ({ ...prev, offset: (page - 1) * prev.limit }))}
      />
    );
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <CIcon icon={cilWallet} className="me-2" />
                Wallet Management
              </h4>
              <CButton color="primary" onClick={() => setShowAddModal(true)}>
                <CIcon icon={cilPlus} className="me-1" />
                Add Credits
              </CButton>
            </div>
          </CCardHeader>
          <CCardBody>
            {/* Stats Cards */}
            {stats && (
              <CRow className="mb-4">
                <CCol sm={6} lg={3}>
                  <CWidgetStatsA
                    className="mb-3"
                    color="primary"
                    value={stats.totalWallets || 0}
                    title="Total Wallets"
                    icon={<CIcon icon={cilWallet} height={24} />}
                  />
                </CCol>
                <CCol sm={6} lg={3}>
                  <CWidgetStatsA
                    className="mb-3"
                    color="success"
                    value={formatAmount(stats.totalBalance)}
                    title="Total Balance"
                    icon={<CIcon icon={cilWallet} height={24} />}
                  />
                </CCol>
                <CCol sm={6} lg={3}>
                  <CWidgetStatsA
                    className="mb-3"
                    color="info"
                    value={formatAmount(stats.todayPurchases)}
                    title="Today's Purchases"
                    icon={<CIcon icon={cilArrowThickRight} height={24} />}
                  />
                </CCol>
                <CCol sm={6} lg={3}>
                  <CWidgetStatsA
                    className="mb-3"
                    color="warning"
                    value={formatAmount(stats.todayRewards)}
                    title="Today's Rewards"
                    icon={<CIcon icon={cilArrowThickRight} height={24} />}
                  />
                </CCol>
              </CRow>
            )}

            {/* Tab Navigation */}
            <div className="mb-3">
              <CButton
                color={activeTab === 'wallets' ? 'primary' : 'outline-primary'}
                className="me-2"
                onClick={() => setActiveTab('wallets')}
              >
                <CIcon icon={cilWallet} className="me-1" />
                Wallets
              </CButton>
              <CButton
                color={activeTab === 'transactions' ? 'primary' : 'outline-primary'}
                onClick={() => setActiveTab('transactions')}
              >
                <CIcon icon={cilHistory} className="me-1" />
                All Transactions
              </CButton>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" size="xl" />
              </div>
            ) : activeTab === 'wallets' ? (
              <>
                <CTable hover responsive className="mt-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>User</CTableHeaderCell>
                      <CTableHeaderCell>Email</CTableHeaderCell>
                      <CTableHeaderCell>Phone</CTableHeaderCell>
                      <CTableHeaderCell>Balance</CTableHeaderCell>
                      <CTableHeaderCell>Total Earned</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {wallets.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center py-4">
                          No wallets found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      wallets.map((wallet) => (
                        <CTableRow key={wallet.id}>
                          <CTableDataCell>{wallet.User?.name || 'N/A'}</CTableDataCell>
                          <CTableDataCell>{wallet.User?.email || 'N/A'}</CTableDataCell>
                          <CTableDataCell>{wallet.User?.phone || 'N/A'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="success">{formatAmount(wallet.balance)}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{formatAmount(wallet.totalCreditsEarned || 0)}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              size="sm"
                              color="info"
                              variant="outline"
                              onClick={() => handleViewWallet(wallet)}
                            >
                              <CIcon icon={cilSearch} className="me-1" />
                              View
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
                {renderPagination()}
              </>
            ) : (
              <>
                <CTable hover responsive className="mt-3">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>User</CTableHeaderCell>
                      <CTableHeaderCell>Type</CTableHeaderCell>
                      <CTableHeaderCell>Amount</CTableHeaderCell>
                      <CTableHeaderCell>Balance Before</CTableHeaderCell>
                      <CTableHeaderCell>Balance After</CTableHeaderCell>
                      <CTableHeaderCell>Status</CTableHeaderCell>
                      <CTableHeaderCell>Description</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {transactions.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center py-4">
                          No transactions found
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <CTableRow key={transaction.id}>
                          <CTableDataCell>{transaction.User?.name || 'N/A'}</CTableDataCell>
                          <CTableDataCell>{getTransactionTypeBadge(transaction.type)}</CTableDataCell>
                          <CTableDataCell>
                            <span className={transaction.amount >= 0 ? 'text-success' : 'text-danger'}>
                              {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                            </span>
                          </CTableDataCell>
                          <CTableDataCell>{formatAmount(transaction.balanceBefore)}</CTableDataCell>
                          <CTableDataCell>{formatAmount(transaction.balanceAfter)}</CTableDataCell>
                          <CTableDataCell>{getStatusBadge(transaction.status)}</CTableDataCell>
                          <CTableDataCell>{transaction.description || '-'}</CTableDataCell>
                          <CTableDataCell>{formatDate(transaction.createdAt)}</CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
                {renderTransactionPagination()}
              </>
            )}
          </CCardBody>
        </CCard>
      </CCol>

      {/* Add Credits Modal */}
      <CModal visible={showAddModal} onClose={() => setShowAddModal(false)}>
        <CModalHeader>
          <CModalTitle>Add Credits to Wallet</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleAddCredits}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>User ID</CFormLabel>
              <CFormInput
                type="number"
                placeholder="Enter user ID"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                invalid={!!formErrors.userId}
              />
              {formErrors.userId && <div className="text-danger">{formErrors.userId}</div>}
            </div>
            <div className="mb-3">
              <CFormLabel>Credits Amount</CFormLabel>
              <CFormInput
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter credits amount"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                invalid={!!formErrors.credits}
              />
              {formErrors.credits && <div className="text-danger">{formErrors.credits}</div>}
            </div>
            <div className="mb-3">
              <CFormLabel>Description (Optional)</CFormLabel>
              <CFormInput
                type="text"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? <CSpinner size="sm" /> : 'Add Credits'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Transaction Details Modal */}
      <CModal size="lg" visible={showTransactionModal} onClose={() => setShowTransactionModal(false)}>
        <CModalHeader>
          <CModalTitle>
            Wallet Details - {selectedUser?.name || 'User'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedWallet && (
            <>
              <div className="mb-4">
                <CRow>
                  <CCol md={4}>
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Current Balance</div>
                      <div className="h4 mb-0">{formatAmount(selectedWallet.balance)}</div>
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Total Earned</div>
                      <div className="h4 mb-0">{formatAmount(selectedWallet.totalCreditsEarned || 0)}</div>
                    </div>
                  </CCol>
                  <CCol md={4}>
                    <div className="p-3 bg-light rounded">
                      <div className="text-muted small">Total Spent</div>
                      <div className="h4 mb-0">{formatAmount(selectedWallet.totalCreditsSpent || 0)}</div>
                    </div>
                  </CCol>
                </CRow>
              </div>
              <h6>Recent Transactions</h6>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Amount</CTableHeaderCell>
                    <CTableHeaderCell>Balance After</CTableHeaderCell>
                    <CTableHeaderCell>Description</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {transactions.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center py-3">
                        No transactions
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <CTableRow key={transaction.id}>
                        <CTableDataCell>{getTransactionTypeBadge(transaction.type)}</CTableDataCell>
                        <CTableDataCell>
                          <span className={transaction.amount >= 0 ? 'text-success' : 'text-danger'}>
                            {transaction.amount >= 0 ? '+' : ''}{formatAmount(transaction.amount)}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>{formatAmount(transaction.balanceAfter)}</CTableDataCell>
                        <CTableDataCell>{transaction.description || '-'}</CTableDataCell>
                        <CTableDataCell>{formatDate(transaction.createdAt)}</CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowTransactionModal(false)}>
            Close
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  );
};

export default WalletManagement;
