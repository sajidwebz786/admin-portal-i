import React, { useState, useEffect } from 'react';
import { userService } from '../services/api';

const RewardSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [settings, setSettings] = useState({
    rewardPointsEnabled: false,
    pointsPerRupee: 1,
    signupBonusPoints: 0,
    referralBonusPoints: 0,
    minRedemptionPoints: 100,
    redemptionDiscountPercent: 1,
    maxPointsPerOrder: 0,
    pointsExpirationDays: 0,
    rewardTiers: [
      { name: 'Bronze', minPoints: 0, multiplier: 1 },
      { name: 'Silver', minPoints: 500, multiplier: 1.25 },
      { name: 'Gold', minPoints: 1500, multiplier: 1.5 },
      { name: 'Platinum', minPoints: 5000, multiplier: 2 }
    ]
  });

  useEffect(() => {
    fetchRewardSettings();
  }, []);

  const fetchRewardSettings = async () => {
    try {
      // Try to get reward settings from user service (stored in user document)
      const response = await userService.getAll();
      const users = response.data || [];
      
      // Look for any user with reward settings
      const userWithRewards = users.find(u => u.rewardSettings);
      if (userWithRewards?.rewardSettings) {
        setSettings({ ...settings, ...userWithRewards.rewardSettings });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reward settings:', error);
      // Use default settings if API fails
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleTierChange = (index, field, value) => {
    const newTiers = [...settings.rewardTiers];
    newTiers[index][field] = field === 'name' ? value : parseFloat(value);
    setSettings({ ...settings, rewardTiers: newTiers });
  };

  const handleAddTier = () => {
    setSettings({
      ...settings,
      rewardTiers: [
        ...settings.rewardTiers,
        { name: 'New Tier', minPoints: 0, multiplier: 1 }
      ]
    });
  };

  const handleRemoveTier = (index) => {
    const newTiers = settings.rewardTiers.filter((_, i) => i !== index);
    setSettings({ ...settings, rewardTiers: newTiers });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Save reward settings - in a real app, this would save to a dedicated settings endpoint
      // For now, we'll just show success since we don't have a backend endpoint
      setTimeout(() => {
        setMessage({ type: 'success', text: 'Reward settings saved successfully! (Local mode - not saved to server)' });
        setSaving(false);
      }, 500);
    } catch (error) {
      console.error('Error saving reward settings:', error);
      setMessage({ type: 'danger', text: 'Failed to save settings. Please try again.' });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="content-header">
          <div className="container-fluid">
            <div className="row mb-2">
              <div className="col-sm-6">
                <h1 className="m-0">Reward Settings</h1>
              </div>
            </div>
          </div>
        </div>
        <div className="content">
          <div className="container-fluid">
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Reward Settings</h1>
            </div>
            <div className="col-sm-6">
              <ol className="breadcrumb float-sm-right">
                <li className="breadcrumb-item"><a href="/">Home</a></li>
                <li className="breadcrumb-item active">Reward Settings</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="content">
        <div className="container-fluid">
          {message.text && (
            <div className={`alert alert-${message.type} alert-dismissible`}>
              <button type="button" className="close" data-dismiss="alert" onClick={() => setMessage({ type: '', text: '' })}>
                &times;
              </button>
              {message.text}
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Loyalty & Reward Points Configuration</h3>
            </div>
            <form onSubmit={handleSave}>
              <div className="card-body">
                {/* Enable/Disable Rewards */}
                <div className="form-group">
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="rewardPointsEnabled"
                      name="rewardPointsEnabled"
                      checked={settings.rewardPointsEnabled}
                      onChange={handleInputChange}
                    />
                    <label className="custom-control-label" htmlFor="rewardPointsEnabled">
                      <strong>Enable Reward Points System</strong>
                    </label>
                  </div>
                  <small className="text-muted">When enabled, customers can earn and redeem points on orders</small>
                </div>

                <hr />

                {/* Points Configuration */}
                <h5 className="mb-3">Points Configuration</h5>
                
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Points Per Rupee (INR) Spent</label>
                      <input
                        type="number"
                        className="form-control"
                        name="pointsPerRupee"
                        value={settings.pointsPerRupee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.1"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Number of points earned for every ₹1 (One Rupee) spent</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Signup Bonus Points</label>
                      <input
                        type="number"
                        className="form-control"
                        name="signupBonusPoints"
                        value={settings.signupBonusPoints}
                        onChange={handleInputChange}
                        min="0"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Points awarded when a new customer registers</small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Referral Bonus Points</label>
                      <input
                        type="number"
                        className="form-control"
                        name="referralBonusPoints"
                        value={settings.referralBonusPoints}
                        onChange={handleInputChange}
                        min="0"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Points awarded to both referrer and referee</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Minimum Points for Redemption</label>
                      <input
                        type="number"
                        className="form-control"
                        name="minRedemptionPoints"
                        value={settings.minRedemptionPoints}
                        onChange={handleInputChange}
                        min="0"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Minimum points required before customer can redeem</small>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Redemption Discount (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="redemptionDiscountPercent"
                        value={settings.redemptionDiscountPercent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Discount percentage per 100 points</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>Max Points Per Order</label>
                      <input
                        type="number"
                        className="form-control"
                        name="maxPointsPerOrder"
                        value={settings.maxPointsPerOrder}
                        onChange={handleInputChange}
                        min="0"
                        disabled={!settings.rewardPointsEnabled}
                      />
                      <small className="text-muted">Maximum points that can be redeemed in a single order (0 = unlimited)</small>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Reward Tiers */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Reward Tiers</h5>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={handleAddTier}
                    disabled={!settings.rewardPointsEnabled}
                  >
                    <i className="fas fa-plus"></i> Add Tier
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Tier Name</th>
                        <th>Minimum Points</th>
                        <th>Points Multiplier</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settings.rewardTiers.map((tier, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={tier.name}
                              onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                              disabled={!settings.rewardPointsEnabled}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={tier.minPoints}
                              onChange={(e) => handleTierChange(index, 'minPoints', e.target.value)}
                              min="0"
                              disabled={!settings.rewardPointsEnabled}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={tier.multiplier}
                              onChange={(e) => handleTierChange(index, 'multiplier', e.target.value)}
                              min="0"
                              step="0.1"
                              disabled={!settings.rewardPointsEnabled}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveTier(index)}
                              disabled={!settings.rewardPointsEnabled || settings.rewardTiers.length <= 1}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !settings.rewardPointsEnabled}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RewardSettings;
