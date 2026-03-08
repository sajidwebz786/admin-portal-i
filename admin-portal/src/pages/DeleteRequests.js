import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { deleteRequestService, api } from '../services/api';
import { authService } from '../services/api';

const DeleteRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionNote, setActionNote] = useState('');

  // Get current user
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await deleteRequestService.getAll();
      console.log('Delete requests data received:', response.data?.length || 0);

      setRequests(response.data || []);
    } catch (error) {
      console.error('Delete requests error:', error);
      setError(`Failed to load delete requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest({ ...request, action: 'approve' });
    setActionNote('');
    setShowModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest({ ...request, action: 'reject' });
    setActionNote('');
    setShowModal(true);
  };

  const submitAction = async () => {
    if (!selectedRequest) return;

    try {
      if (selectedRequest.action === 'approve') {
        await deleteRequestService.approve(selectedRequest.id, {
          approvedBy: currentUser.id,
          approvalNote: actionNote
        });
        setSuccess(`Request to delete "${selectedRequest.entityName}" has been approved`);
      } else {
        await deleteRequestService.reject(selectedRequest.id, {
          approvedBy: currentUser.id,
          approvalNote: actionNote
        });
        setSuccess(`Request to delete "${selectedRequest.entityName}" has been rejected`);
      }
      
      setShowModal(false);
      setSelectedRequest(null);
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Action error:', error);
      setError(`Failed to ${selectedRequest.action} request`);
    }
  };

  const getEntityTypeLabel = (type) => {
    const labels = {
      product: 'Product',
      pack: 'Pack',
      category: 'Category',
      packType: 'Pack Type',
      unitType: 'Unit Type'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return badges[status] || 'badge-secondary';
  };

  // Redirect if not authenticated or not admin
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="alert alert-warning">
            <h5><i className="icon fas fa-exclamation-triangle"></i> Access Denied</h5>
            Only administrators can view and manage delete requests.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12 text-center">
              <div className="spinner" style={{ margin: '50px auto' }}></div>
              <p>Loading delete requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="content">
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-2">
          <div className="col-sm-6">
            <h1>Delete Requests</h1>
          </div>
          <div className="col-sm-6">
            <ol className="breadcrumb float-sm-right">
              <li className="breadcrumb-item">
                <a href="#">Home</a>
              </li>
              <li className="breadcrumb-item active">Delete Requests</li>
            </ol>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger alert-dismissible">
                <button
                  type="button"
                  className="close"
                  onClick={() => setError('')}
                >
                  ×
                </button>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-success alert-dismissible">
                <button
                  type="button"
                  className="close"
                  onClick={() => setSuccess('')}
                >
                  ×
                </button>
                {success}
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests Count Alert */}
        {pendingRequests.length > 0 && (
          <div className="row">
            <div className="col-12">
              <div className="alert alert-warning alert-dismissible">
                <button
                  type="button"
                  className="close"
                  onClick={() => setSuccess('')}
                >
                  ×
                </button>
                <h5><i className="icon fas fa-exclamation-triangle"></i> Attention Required!</h5>
                You have {pendingRequests.length} pending delete request(s) from staff users that require your approval.
              </div>
            </div>
          </div>
        )}

        {/* Delete Requests Table */}
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">All Delete Requests</h3>
                <div className="card-tools">
                  <button className="btn btn-primary btn-sm" onClick={fetchRequests}>
                    <i className="fas fa-sync"></i> Refresh
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Entity Type</th>
                        <th>Entity Name</th>
                        <th>Requested By</th>
                        <th>Request Note</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.id}</td>
                          <td>
                            <span className="badge badge-info">
                              {getEntityTypeLabel(request.entityType)}
                            </span>
                          </td>
                          <td>{request.entityName}</td>
                          <td>
                            {request.requester?.name || request.requestedBy}
                            <br />
                            <small className="text-muted">
                              {request.requester?.email || ''}
                            </small>
                          </td>
                          <td>
                            {request.requestNote || '-'}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(request.status)}`}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </td>
                          <td>
                            {new Date(request.createdAt).toLocaleDateString()}
                            <br />
                            <small className="text-muted">
                              {new Date(request.createdAt).toLocaleTimeString()}
                            </small>
                          </td>
                          <td>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-success mr-2"
                                  onClick={() => handleApprove(request)}
                                  title="Approve"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleReject(request)}
                                  title="Reject"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </>
                            )}
                            {request.status === 'approved' && (
                              <span className="text-success">
                                <i className="fas fa-check-circle"></i> Approved
                                <br />
                                <small className="text-muted">
                                  By: {request.approver?.name || request.approvedBy}
                                </small>
                              </span>
                            )}
                            {request.status === 'rejected' && (
                              <span className="text-danger">
                                <i className="fas fa-times-circle"></i> Rejected
                                <br />
                                <small className="text-muted">
                                  By: {request.approver?.name || request.approvedBy}
                                </small>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {requests.length === 0 && (
                  <div className="text-center py-4">
                    <p>No delete requests found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Approve/Reject Modal */}
        {showModal && selectedRequest && (
          <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title">
                    {selectedRequest.action === 'approve' ? 'Approve' : 'Reject'} Delete Request
                  </h4>
                  <button
                    type="button"
                    className="close"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Entity Type</label>
                    <p className="form-control-static">
                      {getEntityTypeLabel(selectedRequest.entityType)}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Entity Name</label>
                    <p className="form-control-static">{selectedRequest.entityName}</p>
                  </div>
                  <div className="form-group">
                    <label>Requested By</label>
                    <p className="form-control-static">
                      {selectedRequest.requester?.name || selectedRequest.requestedBy}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>Request Note</label>
                    <p className="form-control-static">
                      {selectedRequest.requestNote || 'No note provided'}
                    </p>
                  </div>
                  <div className="form-group">
                    <label>
                      {selectedRequest.action === 'approve' ? 'Approval Note' : 'Rejection Reason'}
                      (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={selectedRequest.action === 'approve' 
                        ? 'Add a note about this approval...' 
                        : 'Why are you rejecting this request?'}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${selectedRequest.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                    onClick={submitAction}
                  >
                    {selectedRequest.action === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showModal && <div className="modal-backdrop fade show"></div>}
      </div>
    </div>
  );
};

export default DeleteRequests;
