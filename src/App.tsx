import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { generateClient } from 'aws-amplify/data';
import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { useEffect, useState, useMemo } from 'react';
import { 
  Container, 
  Form, 
  Button, 
  Table, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Alert, 
  Modal 
} from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const client = generateClient<Schema>();

type Restaurant = Schema['Restaurant']['type'];

function MainApp({ signOut, user }: { signOut?: () => void, user?: any }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '', city: '' });
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userNickname, setUserNickname] = useState<string>('');

  // Fetch initial data
  const listRestaurants = async () => {
    try {
      const { data: items } = await client.models.Restaurant.list();
      setRestaurants(items);
    } catch (err) {
      console.error('Error fetching restaurants:', err);
      setError('Failed to load restaurants. Please refresh the page.');
    }
  };

  // Fetch user attributes
  const getUserAttributes = async () => {
    try {
      const attributes = await fetchUserAttributes();
      setUserNickname(attributes.preferred_username || '');
    } catch (err) {
      console.error('Error fetching attributes:', err);
    }
  };

  // Subscriptions
  useEffect(() => {
    listRestaurants();
    getUserAttributes();

    const createSub = client.models.Restaurant.onCreate().subscribe({
      next: (data) => setRestaurants(prev => {
        if (prev.some(r => r.id === data.id)) return prev;
        return [...prev, data];
      }),
    });

    const updateSub = client.models.Restaurant.onUpdate().subscribe({
      next: (data) => setRestaurants(prev => 
        prev.map(r => r.id === data.id ? { ...r, ...data } : r)
      ),
    });

    const deleteSub = client.models.Restaurant.onDelete().subscribe({
      next: (data) => setRestaurants(prev => prev.filter(r => r.id !== data.id)),
    });

    return () => {
      createSub.unsubscribe();
      updateSub.unsubscribe();
      deleteSub.unsubscribe();
    };
  }, []);

  // Mutations
  const createRestaurant = async () => {
    setLoading(true);
    setError(null);
    try {
      await client.models.Restaurant.create(formData as any);
      showSuccess(`"${formData.name}" added successfully!`);
      resetForm();
    } catch (err) {
      setError('Failed to create restaurant.');
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async () => {
    if (!editingRestaurant) return;
    setLoading(true);
    setError(null);
    try {
      await client.models.Restaurant.update({
        id: editingRestaurant.id,
        ...formData
      } as any);
      showSuccess(`"${formData.name}" updated successfully!`);
      resetForm();
      setShowEditModal(false);
    } catch (err) {
      setError('Failed to update restaurant.');
    } finally {
      setLoading(false);
    }
  };

  const deleteRestaurant = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleteLoading(id);
    try {
      await client.models.Restaurant.delete({ id });
      showSuccess(`"${name}" deleted.`);
    } catch (err) {
      setError(`Failed to delete "${name}".`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', city: '' });
    setEditingRestaurant(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.city) {
      setError('Please fill in all fields');
      return;
    }
    editingRestaurant ? updateRestaurant() : createRestaurant();
  };

  const startEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setFormData({
      name: restaurant.name,
      description: restaurant.description,
      city: restaurant.city,
    });
    setShowEditModal(true);
  };

  // Search + Sort
  const processedRestaurants = useMemo(() => {
    let result = [...restaurants];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(r => 
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.city.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      let valA: any = sortBy === 'name' ? (a.name || '').toLowerCase() :
                      sortBy === 'city' ? (a.city || '').toLowerCase() :
                      new Date(a.createdAt || 0);
      let valB: any = sortBy === 'name' ? (b.name || '').toLowerCase() :
                      sortBy === 'city' ? (b.city || '').toLowerCase() :
                      new Date(b.createdAt || 0);

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [restaurants, searchTerm, sortBy, sortOrder]);

  const displayName = userNickname || user?.signInDetails?.loginId || user?.username || 'User';

  return (
    <div className="App">
      <nav className="navbar navbar-dark bg-primary mb-4 shadow-sm">
        <Container>
          <span className="navbar-brand mb-0 h1">
            🍽️ Restaurant Manager 
          </span>

          <div className="d-flex align-items-center gap-3">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => {
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                  document.documentElement.classList.remove('dark');
                  localStorage.setItem('theme', 'light');
                } else {
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                }
              }}
            >
              <span className="fs-5">
                {document.documentElement.classList.contains('dark') ? '☀️' : '🌙'}
              </span>
            </Button>

            <span className="text-white">
              👤 {displayName}
            </span>

            <Button variant="outline-light" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Container>
      </nav>

      <Container>
        {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

        <Row className="mb-4">
          <Col lg={4} md={12} className="mb-4 mb-lg-0">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  {editingRestaurant ? '✏️ Edit Restaurant' : '➕ Add New Restaurant'}
                </h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Restaurant Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., Pizza Paradise"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe the restaurant..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., New York"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button variant="primary" type="submit" disabled={loading} size="lg">
                      {loading 
                        ? (editingRestaurant ? 'Updating...' : 'Adding...') 
                        : (editingRestaurant ? 'Update Restaurant' : 'Add Restaurant')}
                    </Button>
                    {editingRestaurant && (
                      <Button variant="secondary" onClick={() => { setShowEditModal(false); resetForm(); }}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                <h5 className="mb-0">📋 All Restaurants</h5>
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Form.Control
                    type="text"
                    placeholder="Search restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '240px' }}
                  />
                  <Form.Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)} 
                    style={{ width: '140px' }}
                  >
                    <option value="createdAt">Newest</option>
                    <option value="name">Name</option>
                    <option value="city">City</option>
                  </Form.Select>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                  </Button>
                  <Badge bg="primary" pill>
                    {processedRestaurants.length} Restaurants
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body className="p-0">
                {processedRestaurants.length > 0 ? (
                  <div className="table-responsive">
                    <Table striped hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Description</th>
                          <th>City</th>
                          <th>Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedRestaurants.map((restaurant, index) => (
                          <tr key={restaurant.id}>
                            <td>{index + 1}</td>
                            <td><strong>{restaurant.name}</strong></td>
                            <td className="text-muted text-truncate" style={{ maxWidth: '260px' }}>{restaurant.description}</td>
                            <td><Badge bg="secondary" pill>{restaurant.city}</Badge></td>
                            <td className="text-muted small">{restaurant.createdAt ? new Date(restaurant.createdAt).toLocaleDateString() : 'Just now'}</td>
                            <td>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="me-2"
                                onClick={() => startEdit(restaurant)}
                              >
                                Edit
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                disabled={deleteLoading === restaurant.id}
                                onClick={() => deleteRestaurant(restaurant.id, restaurant.name)}
                              >
                                {deleteLoading === restaurant.id ? 'Deleting...' : 'Delete'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🍽️</div>
                    <h5>No restaurants found</h5>
                    <p>{searchTerm ? 'Try a different search term.' : 'Add your first restaurant using the form on the left.'}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showEditModal} onHide={() => { setShowEditModal(false); resetForm(); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Restaurant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Restaurant Name</Form.Label>
              <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
            </Form.Group>

            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Changes'}
              </Button>
              <Button variant="secondary" onClick={() => { setShowEditModal(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

function App() {
  return (
    <Authenticator
      formFields={{
        signUp: {
          preferred_username: {
            order: 1,
            label: 'Username (optional)',
            placeholder: 'Choose a username',
            isRequired: false,
          },
        },
      }}
    >
      {({ signOut, user }) => <MainApp signOut={signOut} user={user} />}
    </Authenticator>
  );
}

export default App;