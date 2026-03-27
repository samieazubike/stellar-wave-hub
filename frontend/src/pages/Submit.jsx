import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = ['defi', 'payments', 'infrastructure', 'tooling', 'nft', 'dao', 'rwa', 'social', 'gaming', 'other'];

export default function Submit() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', description: '', long_description: '', category: '',
    repo_url: '', live_url: '', stellar_account_id: '', stellar_contract_id: '', tags: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const tags = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const longDescriptionWords = form.long_description.trim().split(/\s+/).filter(Boolean).length;
    const stellarAccountPattern = /^G[A-Z2-7]{55}$/;

    if (!form.stellar_account_id.trim()) {
      setError('Stellar Account ID is required.');
      setLoading(false);
      return;
    }

    if (!stellarAccountPattern.test(form.stellar_account_id.trim())) {
      setError('Stellar Account ID must be a valid Stellar public key (starts with G and 56 chars).');
      setLoading(false);
      return;
    }

    if (tags.length === 0) {
      setError('Please provide at least one tag.');
      setLoading(false);
      return;
    }

    if (longDescriptionWords < 200) {
      setError('Full description should be at least 200 words.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...form,
        tags,
      };
      await api.post('/projects', payload);
      navigate('/my-submissions');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function field(key) {
    return { value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) };
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Submit a Project</h1>
      <p className="text-gray-500 mb-6 text-sm">Your submission will be reviewed by an admin before appearing in the public directory.</p>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="label">Project Name *</label>
          <input type="text" required {...field('name')} className="input" />
        </div>
        <div>
          <label className="label">Short Description *</label>
          <input type="text" required maxLength={200} {...field('description')} className="input" />
        </div>
        <div>
          <label className="label">Full Description * (min 200 words)</label>
          <textarea
            rows={7}
            required
            {...field('long_description')}
            className="input resize-none"
            placeholder="Describe the target emerging market, financial inclusion impact, and Stellar integration in detail."
          />
        </div>
        <div>
          <label className="label">Category *</label>
          <select required {...field('category')} className="input">
            <option value="">Select a category</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Repository URL</label>
            <input type="url" placeholder="https://github.com/..." {...field('repo_url')} className="input" />
          </div>
          <div>
            <label className="label">Live URL</label>
            <input type="url" placeholder="https://..." {...field('live_url')} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Stellar Account ID *</label>
            <input
              type="text"
              required
              placeholder="G..."
              {...field('stellar_account_id')}
              className="input"
            />
          </div>
          <div>
            <label className="label">Soroban Contract ID</label>
            <input type="text" placeholder="C..." {...field('stellar_contract_id')} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Tags (comma-separated) *</label>
          <input
            type="text"
            required
            placeholder="defi, yield, xlm"
            {...field('tags')}
            className="input"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Submitting…' : 'Submit Project'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  );
}
