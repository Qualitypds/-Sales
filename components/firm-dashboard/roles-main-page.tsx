'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
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
  Pagination
} from '@heroui/react';
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../context/LanguageContext';
import { lang } from '../Lang/lang';

type Role = {
  id: number;
  name: string;
  displayName: string;
  guard: string;
  description: string;
  permissions: string[];
  isActive: boolean;
};

type RoleForm = Omit<Role, 'id'> & { id?: number };

const permissionCatalog = [
  'manage_users',
  'show_panel',
  'create_cases',
  'edit_cases',
  'delete_cases',
  'view_cases',
  'prepare_documents',
  'support_lawyers',
  'view_reports',
  'manage_payments',
  'view_own_cases',
] as const;

const guards = ['admin', 'lawyer', 'client', 'paralegal', 'accountant'] as const;
const API_BASE_URL = '/api/v1/admin';
const DEFAULT_LAW_FIRM_ID = 1;

export default function RolesPage() {
  const { language } = useLanguage();
  const t = (key: string) => lang(language, key);
  const translatePermission = (permKey: string) => lang(language, `permissions.${permKey}`);
  const translateGuard = (guardKey: string) => lang(language, `roles.guard.${guardKey}`);
  const pageSize = 5;

  const initialRoles: Role[] = [
    {
      id: 1,
      name: 'system_admin',
      displayName: lang(language, 'roles.seed.system_admin.name'),
      guard: 'admin',
      description: lang(language, 'roles.seed.system_admin.description'),
      permissions: ['manage_users', 'show_panel', 'create_cases', 'view_reports'],
      isActive: true,
    },
    {
      id: 2,
      name: 'lawyer',
      displayName: lang(language, 'roles.seed.lawyer.name'),
      guard: 'lawyer',
      description: lang(language, 'roles.seed.lawyer.description'),
      permissions: ['view_cases', 'edit_cases', 'prepare_documents'],
      isActive: true,
    },
    {
      id: 3,
      name: 'client',
      displayName: lang(language, 'roles.seed.client.name'),
      guard: 'client',
      description: lang(language, 'roles.seed.client.description'),
      permissions: ['view_own_cases'],
      isActive: true,
    },
    {
      id: 4,
      name: 'paralegal',
      displayName: lang(language, 'roles.seed.paralegal.name'),
      guard: 'paralegal',
      description: lang(language, 'roles.seed.paralegal.description'),
      permissions: ['prepare_documents', 'support_lawyers'],
      isActive: true,
    },
    {
      id: 5,
      name: 'accountant',
      displayName: lang(language, 'roles.seed.accountant.name'),
      guard: 'accountant',
      description: lang(language, 'roles.seed.accountant.description'),
      permissions: ['view_reports', 'manage_payments'],
      isActive: false,
    },
  ];

  const [permissions, setPermissions] = useState<Role[]>(initialRoles);

  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [search, setSearch] = useState('');
  const [guardFilter, setGuardFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleForm>({
    name: '',
    displayName: '',
    guard: 'admin',
    description: '',
    permissions: [],
    isActive: true,
  });
  const [isEditing, setIsEditing] = useState(false);

  const viewModal = useDisclosure();
  const editModal = useDisclosure();


  const fetchPermissions = async () => {
    try {
      const params = new URLSearchParams({
        law_firm_id: DEFAULT_LAW_FIRM_ID.toString(),
      });

      const response = await fetch(`${API_BASE_URL}/permissions/list?${params}`, {
        headers: {
          'accept-language': language,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      setPermissions(data.data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [])

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        !search.trim() ||
        role.displayName.toLowerCase().includes(search.toLowerCase()) ||
        role.permissions.some((perm) => perm.toLowerCase().includes(search.toLowerCase()));
      const matchesGuard = guardFilter === 'all' || role.guard === guardFilter;
      return matchesSearch && matchesGuard;
    });
  }, [roles, search, guardFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [search, guardFilter]);

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const paginatedRoles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRoles.slice(start, start + pageSize);
  }, [filteredRoles, page, pageSize]);

  const stats = useMemo(() => {
    const active = roles.filter((role) => role.isActive).length;
    const inactive = roles.length - active;
    const legalOps = roles.filter((role) => ['lawyer', 'paralegal'].includes(role.guard)).length;
    return [
      { label: lang(language, 'roles.stats.active'), value: active, accent: 'success' },
      { label: lang(language, 'roles.stats.inactive'), value: inactive, accent: 'danger' },
      { label: lang(language, 'roles.stats.legal_ops'), value: legalOps, accent: 'primary' },
    ];
  }, [roles, language]);

  const openCreateRole = () => {
    setFormData({ name: '', displayName: '', guard: 'admin', description: '', permissions: [], isActive: true });
    setIsEditing(false);
    editModal.onOpen();
  };

  const openEditRole = (role: Role) => {
    setFormData({ ...role });
    setIsEditing(true);
    editModal.onOpen();
  };

  const handleSaveRole = () => {
    if (!formData.displayName.trim()) return;
    const normalized = {
      ...formData,
      name: formData.displayName.trim().toLowerCase().replace(/\s+/g, '_'),
    } as Role;

    if (isEditing && normalized.id) {
      setRoles((prev) => prev.map((role) => (role.id === normalized.id ? (normalized as Role) : role)));
    } else {
      const nextId = roles.length ? Math.max(...roles.map((role) => role.id)) + 1 : 1;
      setRoles((prev) => [...prev, { ...(normalized as Role), id: nextId }]);
    }

    editModal.onClose();
  };

  const handleDeleteRole = (id: number) => {
    setRoles((prev) => prev.filter((role) => role.id !== id));
  };

  const toggleActive = (id: number) => {
    setRoles((prev) => prev.map((role) => (role.id === id ? { ...role, isActive: !role.isActive } : role)));
  };

  const statusChip = (role: Role) => (
    <Chip color={role.isActive ? 'success' : 'danger'} variant="flat" size="sm">
      {role.isActive ? lang(language, 'roles.status.active') : lang(language, 'roles.status.inactive')}
    </Chip>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8"
    >
      <div className="mx-auto w-full space-y-8">
        <section className="flex flex-col gap-4 pt-5 ring-1 ring-content2/60 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] ">
              {lang(language, 'roles.hero.tag')}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text">
              {lang(language, 'roles.hero.title')}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="solid"
              color="primary"
              onPress={openCreateRole}
              startContent={<PlusIcon className="h-4 w-4" />}
            >
              {lang(language, 'roles.hero.button_new')}
            </Button>
          </div>
        </section>

        <Table
          aria-label={lang(language, 'permissions.table.aria')}
          classNames={{ table: 'min-w-full text-base' }}
          topContent={
            <div className="flex justify-between gap-3 items-center">
              <div className='flex items-center gap-2'>
                <Input
                  radius="lg"
                  label={lang(language, 'roles.search.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  variant="faded"
                  className="min-w-[250px]"
                />
                <Select
                  radius="lg"
                  aria-label={lang(language, 'roles.filter.guard_aria')}
                  selectedKeys={[guardFilter]}
                  onChange={(e) => setGuardFilter(e.target.value)}
                  variant="faded"
                  label={lang(language, 'roles.filter.guard_label')}
                  className="min-w-xs"
                >
                  <SelectItem key="all">{lang(language, 'roles.filter.all_guards')}</SelectItem>
                  <>
                    {guards.map((guard) => (
                      <SelectItem key={guard}>{translateGuard(guard)}</SelectItem>
                    ))}
                  </>
                </Select>
              </div>

              <p className='text-sm'>
                {`${lang(language, 'roles.table.results_prefix')}${filteredRoles.length}${lang(language, 'roles.table.results_suffix')}`}
              </p>
            </div>
          }
          bottomContent={
            <div className="flex flex-col gap-3 px-2 py-2 text-sm md:flex-row md:items-center md:justify-between">

              <div className="flex w-full flex-wrap justify-between items-center gap-3">
                <div className={`flex gap-2`}>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setPage((prev) => Math.max(prev - 1, 1))}
                    isDisabled={page === 1}
                  >
                    {lang(language, 'roles.pagination.prev')}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    isDisabled={page === totalPages || filteredRoles.length === 0}
                  >
                    {lang(language, 'roles.pagination.next')}
                  </Button>
                </div>
                <span className="text-xs text-foreground/70">
                  {`${lang(language, 'roles.pagination.page_prefix')}${page}${lang(
                    language,
                    'roles.pagination.page_separator'
                  )}${totalPages}`}
                </span>

                <Pagination
                  style={{ direction: 'ltr' }}
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                  isDisabled={filteredRoles.length === 0}
                  showControls
                  color="primary"
                  size="sm"
                />

              </div>
            </div>
          }
        >
          <TableHeader>
            <TableColumn>{lang(language, 'roles.table.column.role')}</TableColumn>
            <TableColumn>{lang(language, 'roles.table.column.description')}</TableColumn>
            <TableColumn>{lang(language, 'roles.table.column.permissions')}</TableColumn>
            <TableColumn>{lang(language, 'roles.table.column.status')}</TableColumn>
            <TableColumn className="text-end">{lang(language, 'roles.table.column.actions')}</TableColumn>
          </TableHeader>
          <TableBody emptyContent={lang(language, 'roles.table.empty')}>
            {paginatedRoles.map((role) => (
              <TableRow key={role.id} className="hover:bg-content2/60">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-text">{role.displayName}</span>
                  </div>
                </TableCell>
                <TableCell className="">{role.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm) => (
                      <Chip key={perm} size="sm" variant="flat" color="primary">
                        {translatePermission(perm)}
                      </Chip>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {statusChip(role)}
                    <Switch size="sm" isSelected={role.isActive} onChange={() => toggleActive(role.id)} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className={`flex items-center justify-end gap-2`}>
                    <Button
                      isIconOnly
                      variant="light"
                      radius="full"
                      onPress={() => {
                        setActiveRole(role);
                        viewModal.onOpen();
                      }}
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Button>
                    <Button isIconOnly variant="light" radius="full" onPress={() => openEditRole(role)}>
                      <PencilSquareIcon className="h-5 w-5" />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      radius="full"
                      color="danger"
                      onPress={() => handleDeleteRole(role.id)}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={viewModal.isOpen} onOpenChange={viewModal.onOpenChange} size="lg" scrollBehavior="inside">
        <ModalContent className="bg-content1/90">
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-xl font-semibold">
                {lang(language, 'roles.modal.details_title')}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm ">{lang(language, 'roles.modal.role_label')}</p>
                    <p className="text-2xl font-semibold">{activeRole?.displayName}</p>
                  </div>
                  {activeRole && statusChip(activeRole)}
                </div>
                <Divider />
                <p className="">{activeRole?.description}</p>
                <div>
                  <p className="mb-2 text-sm ">
                    {lang(language, 'roles.modal.permissions_label')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeRole?.permissions.map((perm) => (
                      <Chip key={perm} variant="flat" color="primary">
                        {translatePermission(perm)}
                      </Chip>
                    ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button radius="lg" variant="light" onPress={viewModal.onClose}>
                  {lang(language, 'roles.modal.close')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={editModal.isOpen} onOpenChange={editModal.onOpenChange} size="xl" scrollBehavior="inside">
        <ModalContent className="bg-content1/95">
          {(onClose) => (
            <>
              <ModalHeader className="text-xl font-semibold">
                {isEditing ? lang(language, 'roles.modal.edit_title') : lang(language, 'roles.modal.create_title')}
              </ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label={lang(language, 'roles.form.role_name')}
                  variant="faded"
                  radius="lg"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
                <Select
                  label={lang(language, 'roles.form.guard')}
                  selectedKeys={[formData.guard]}
                  onChange={(e) => setFormData({ ...formData, guard: e.target.value })}
                  variant="faded"
                  radius="lg"
                >
                  {guards.map((guard) => (
                    <SelectItem key={guard}>{translateGuard(guard)}</SelectItem>
                  ))}
                </Select>
                <Textarea
                  label={lang(language, 'roles.form.description')}
                  variant="faded"
                  radius="lg"
                  minRows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <div>
                  <p className="mb-2 text-sm ">
                    {lang(language, 'roles.form.permissions')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {permissionCatalog.map((perm) => {
                      const selected = formData.permissions.includes(perm);
                      return (
                        <Chip
                          key={perm}
                          variant={selected ? 'solid' : 'flat'}
                          color={selected ? 'primary' : 'default'}
                          className="cursor-pointer"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              permissions: selected
                                ? prev.permissions.filter((p) => p !== perm)
                                : [...prev.permissions, perm],
                            }))
                          }
                        >
                          {translatePermission(perm)}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm ">
                      {lang(language, 'roles.form.activate')}
                    </p>
                    <p className="text-xs ">
                      {lang(language, 'roles.form.activate_hint')}
                    </p>
                  </div>
                  <Switch
                    isSelected={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" radius="lg" onPress={onClose}>
                  {lang(language, 'roles.form.cancel')}
                </Button>
                <Button color="primary" radius="lg" onPress={handleSaveRole}>
                  {lang(language, 'roles.form.save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

