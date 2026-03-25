import React, { useEffect, useState } from 'react';
import api from '../../api/client';

export default function RolesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const { data } = await api.get('/roles');
    setItems(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/roles/${editing._id}`, form);
    } else {
      await api.post('/roles', form);
    }
    setForm({ name: '', code: '', description: '' });
    setEditing(null);
    load();
  };

  const startEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, code: r.code, description: r.description || '' });
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this role?')) return;
    await api.delete(`/roles/${id}`);
    load();
  };

  return (
    <div>
      <h2 className="h4 mb-3">Roles</h2>
      <form className="card card-body mb-4 shadow-sm" onSubmit={save}>
        <h3 className="h6">{editing ? 'Edit role' : 'New role'}</h3>
        <div className="row g-2">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="col-md-2 d-flex" style={{ gap: '0.25rem' }}>
            <button className="btn btn-primary" type="submit">
              {editing ? 'Update' : 'Create'}
            </button>
            {editing && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({ name: '', code: '', description: '' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
      <div className="table-responsive bg-white rounded shadow-sm">
        <table className="table mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>{r.name}</td>
                <td>{r.code}</td>
                <td className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => remove(r._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
