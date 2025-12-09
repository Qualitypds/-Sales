'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';
import { lang } from '../Lang/lang';

type Customer = {
  id: number;
  tenant_id: number;
  branch_id?: number | null;
  full_name: string;
  full_name_ar?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  address_ar?: string | null;
  credit_limit?: number;
  created_at?: string | null;
};

type CustomerForm = Omit<Customer, 'id' | 'tenant_id' | 'created_at'> & { id?: number; tenant_id?: number };

const pageSize = 6;

export default function CustomersPage() {
  const { language } = useLanguage();
  const t = (key: string, vars?: Record<string, string>) => {
    const value = lang(language, key);
    if (!vars) return value;
    return Object.keys(vars).reduce((acc, token) => acc.replace(`{{${token}}}`, vars[token]), value);
  };
  const isRTL = language === 'ar';

  // بيانات تجريبية مؤقتة تعرض قبل عمل API
  const seededCustomers: Customer[] = [
    {
      id: 1,
      tenant_id: 1,
      branch_id: 1,
      full_name: 'Ahmed Ali',
      full_name_ar: 'أحمد علي',
      phone: '+968 99 123456',
      email: 'ahmed.ali@example.com',
      address: 'Muscat, Oman',
      address_ar: 'مسقط، عمان',
      credit_limit: 10000.0,
      created_at: '2025-01-01',
    },
    {
      id: 2,
      tenant_id: 1,
      branch_id: 2,
      full_name: 'Oman Tech LLC',
      full_name_ar: 'شركة عمان للتقنية',
      phone: '+968 95 654321',
      email: 'info@omantech.com',
      address: 'Salalah, Oman',
      address_ar: 'صلالة، عمان',
      credit_limit: 50000.0,
      created_at: '2025-02-01',
    },
  ];

  const [customers, setCustomers] = useState<Customer[]>(seededCustomers);
  const [search, setSearch] = useState('');

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CustomerForm>({
    full_name: '',
    full_name_ar: '',
    phone: '',
    email: '',
    address: '',
    address_ar: '',
    credit_limit: 0.0,
    branch_id: undefined,
    tenant_id: undefined,
  });

  const viewModal = useDisclosure();
  const editModal = useDisclosure();

  const API_BASE = '/api/customers'; // نغير هذا المسار بعد اضافة api م

  async function fetchCustomersFromApi() {
    setLoading(true);
    try {

      const res = await fetch(API_BASE, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      setCustomers(Array.isArray(data) ? data : seededCustomers);
    } catch (err) {
      // إذا فشل الاتصال، بنعرض البيانات التجريبية للعرض (يحذف بعد اضافة api  الاصلي)
      setCustomers(seededCustomers);

      //  إضافة سجلات أخطاء 
    } finally {
      setLoading(false);
    }
  }

  async function createCustomerApi(payload: CustomerForm) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Create failed');
      const created: Customer = await res.json();
      return created;
    } catch (err) {
      // في حالة عدم وجود API بعد، نقوم بإنشاء وهمي محلي
      const fallback: Customer = {
        id: Date.now(),
        tenant_id: payload.tenant_id ?? 1,
        branch_id: payload.branch_id ?? null,
        full_name: payload.full_name,
        full_name_ar: payload.full_name_ar ?? '',
        phone: payload.phone ?? '',
        email: payload.email ?? '',
        address: payload.address ?? '',
        address_ar: payload.address_ar ?? '',
        credit_limit: payload.credit_limit ?? 0,
        created_at: new Date().toISOString(),
      };
      return fallback;
    }
  }

  async function updateCustomerApi(id: number, payload: CustomerForm) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated: Customer = await res.json();
      return updated;
    } catch (err) {
      // fallback محلي
      const fallback: Customer = {
        id,
        tenant_id: payload.tenant_id ?? 1,
        branch_id: payload.branch_id ?? null,
        full_name: payload.full_name,
        full_name_ar: payload.full_name_ar ?? '',
        phone: payload.phone ?? '',
        email: payload.email ?? '',
        address: payload.address ?? '',
        address_ar: payload.address_ar ?? '',
        credit_limit: payload.credit_limit ?? 0,
        created_at: new Date().toISOString(),
      };
      return fallback;
    }
  }

  async function deleteCustomerApi(id: number) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Delete failed');
      return true;
    } catch (err) {
      // في حال عدم وجود API، نعيد true كي تتم العملية محلياً
      return true;
    }
  }

  useEffect(() => {
    fetchCustomersFromApi();
    
  }, []);

  useEffect(() => {
    setCustomers(seededCustomers);
  }, [language]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        !term ||
        c.full_name.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.phone ?? '').toLowerCase().includes(term);
      const matchesType = typeFilter === 'all' || typeFilter === '';
      return matchesSearch && matchesType;
    });
  }, [customers, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));

  useEffect(() => setPage(1), [search, typeFilter]);
  useEffect(() => setPage((prev) => Math.min(prev, totalPages)), [totalPages]);

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page]);

  const resetForm = () => {
    setFormData({
      full_name: '',
      full_name_ar: '',
      phone: '',
      email: '',
      address: '',
      address_ar: '',
      credit_limit: 0.0,
      branch_id: undefined,
      tenant_id: undefined,
    });
  };

  const openCreateCustomer = () => {
    setIsEditing(false);
    resetForm();
    editModal.onOpen();
  };

  const openEditCustomer = (customer: Customer) => {
    setIsEditing(true);
    setFormData({
      id: customer.id,
      tenant_id: customer.tenant_id,
      branch_id: customer.branch_id ?? undefined,
      full_name: customer.full_name,
      full_name_ar: customer.full_name_ar ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      address_ar: customer.address_ar ?? '',
      credit_limit: customer.credit_limit ?? 0,
    });
    editModal.onOpen();
  };

  const handleDeleteCustomer = async (id: number) => {
    if (window.confirm(t('customers.delete.confirmation'))) {
      const ok = await deleteCustomerApi(id);
      if (ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        //  إظهار رسالة خطأ هنا لاحقًا
      }
    }
  };

  const saveCustomer = async () => {
    if (!formData.full_name || !formData.full_name.trim()) return;

    const payload: CustomerForm = {
      tenant_id: formData.tenant_id ?? 1,  
      branch_id: formData.branch_id,
      full_name: formData.full_name,
      full_name_ar: formData.full_name_ar ?? '',
      phone: formData.phone ?? '',
      email: formData.email ?? '',
      address: formData.address ?? '',
      address_ar: formData.address_ar ?? '',
      credit_limit: formData.credit_limit ?? 0,
    };

    if (isEditing && formData.id) {
      const updated = await updateCustomerApi(formData.id, payload);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    } else {
      const created = await createCustomerApi(payload);
      setCustomers((prev) => [...prev, created]);
    }

    editModal.onClose();
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        <section className="flex flex-col gap-4 pt-5 ring-1 ring-content2/60 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em]">{t('customers.hero.tag')}</p>
            <h1 className="mt-2 text-3xl font-semibold text-text">{t('customers.hero.title')}</h1>
          </div>
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-4 w-4" />}
            onPress={openCreateCustomer}
          >
            {t('customers.hero.button_new')}
          </Button>
        </section>

        <Table
          aria-label={t('customers.table.aria')}
          classNames={{ table: 'min-w-full text-base' }}
          topContent={
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Input
                  radius="lg"
                  label={t('customers.search.placeholder')}
                  variant="faded"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-[240px]"
                />


                <Select
                  radius="lg"
                  variant="faded"
                  label={t('customers.filter.type')}
                  selectedKeys={[typeFilter]}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="min-w-[240px]"
                >
                  <SelectItem key="all">{t('customers.filter.type_all')}</SelectItem>
                </Select>
              </div>
              <span className="text-sm text-foreground/70">
                {t('customers.table.results', { count: filteredCustomers.length.toString() })}
              </span>
            </div>
          }
          bottomContent={
            <div className="flex flex-col gap-3 px-2 py-2 text-sm md:flex-row md:items-center md:justify-between">
              <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button size="sm" variant="flat" onPress={() => setPage((prev) => Math.max(prev - 1, 1))} isDisabled={page === 1}>
                  {t('customers.pagination.prev')}
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  isDisabled={page === totalPages || filteredCustomers.length === 0}
                >
                  {t('customers.pagination.next')}
                </Button>
              </div>
              <span className="text-xs text-foreground/60">
                {t('customers.pagination.page', { page: page.toString(), total: totalPages.toString() })}
              </span>
              <Pagination page={page} total={totalPages} onChange={setPage} showControls color="primary" size="sm" isDisabled={filteredCustomers.length === 0} />
            </div>
          }
        >
          <TableHeader>
            <TableColumn>{t('customers.table.column.name')}</TableColumn>
            <TableColumn>{t('customers.table.column.contact')}</TableColumn>
            <TableColumn>{t('customers.table.column.credit_limit')}</TableColumn>
            <TableColumn className="text-center">{t('customers.table.column.actions')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={t('customers.table.empty')}>
            {paginatedCustomers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-content2/60">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar size="sm" radius="lg" name={customer.full_name} className="bg-primary/10 text-primary" />
                    <div>
                      <p className="font-semibold text-text">{language === 'ar' ? (customer.full_name_ar || customer.full_name) : customer.full_name}</p>
                      {customer.created_at && <p className="text-xs text-foreground/60">{new Date(customer.created_at).toLocaleDateString()}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-foreground/70">
                    <p>{customer.email}</p>
                    <p>{customer.phone}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat">{(customer.credit_limit ?? 0).toFixed(2)}</Chip>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center justify-${isRTL ? 'start' : 'end'} gap-2`}>
                    <Button isIconOnly variant="light" radius="full" onPress={() => { setActiveCustomer(customer); viewModal.onOpen(); }}>
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                    <Button isIconOnly variant="light" radius="full" onPress={() => openEditCustomer(customer)}>
                      <PencilSquareIcon className="h-5 w-5" />
                    </Button>
                    <Button isIconOnly variant="light" radius="full" color="danger" onPress={() => handleDeleteCustomer(customer.id)}>
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="lg" backdrop="blur">
        <ModalContent className="bg-content1/95">
          {() => (
            activeCustomer && (
              <>
                <ModalHeader className="flex items-center gap-3">
                  <Avatar size="md" radius="lg" name={activeCustomer.full_name} />
                  <div>
                    <p className="text-lg font-semibold">{activeCustomer.full_name}</p>
                    <p className="text-sm text-foreground/70">{activeCustomer.email}</p>
                  </div>
                </ModalHeader>
                <ModalBody className="space-y-4">
                  <Divider />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/60">{t('customers.modal.contact')}</p>
                    <p className="text-sm">{activeCustomer.email}</p>
                    <p className="text-sm">{activeCustomer.phone}</p>
                  </div>
                  {activeCustomer.address && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-foreground/60">{t('customers.modal.address')}</p>
                      <p className="text-sm leading-relaxed">{activeCustomer.address}</p>
                    </div>
                  )}
                </ModalBody>
                <ModalFooter>
                  <Button radius="lg" variant="light" onPress={viewModal.onClose}>
                    {t('customers.modal.close')}
                  </Button>
                </ModalFooter>
              </>
            )
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="xl" scrollBehavior="inside" backdrop="blur">
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-semibold">{isEditing ? t('customers.form.edit_title') : t('customers.form.create_title')}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={t('customers.form.full_name')}
                  variant="faded"
                  radius="lg"
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                />
                <Input
                  label={t('customers.form.full_name_ar')}
                  variant="faded"
                  radius="lg"
                  value={formData.full_name_ar || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name_ar: e.target.value }))}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t('customers.form.email')}
                    variant="faded"
                    radius="lg"
                    value={formData.email || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                  <Input
                    label={t('customers.form.phone')}
                    variant="faded"
                    radius="lg"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label={t('customers.form.address')}
                    variant="faded"
                    radius="lg"
                    value={formData.address || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  />
                  <Input
                    label={t('customers.form.address_ar')}
                    variant="faded"
                    radius="lg"
                    value={formData.address_ar || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address_ar: e.target.value }))}
                  />
                </div>
                <Input
                  label={t('customers.form.credit_limit')}
                  variant="faded"
                  radius="lg"
                  type="number"
                  value={String(formData.credit_limit ?? 0)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, credit_limit: Number(e.target.value) }))}
                />
                <Textarea
                  label={t('customers.form.notes')}
                  variant="faded"
                  radius="lg"
                  minRows={3}
                  value={''}
                  onChange={() => {}}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" radius="lg" onPress={() => { onClose(); resetForm(); }}>
                  {t('customers.form.cancel')}
                </Button>
                <Button color="primary" radius="lg" onPress={saveCustomer}>
                  {t('customers.form.save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
