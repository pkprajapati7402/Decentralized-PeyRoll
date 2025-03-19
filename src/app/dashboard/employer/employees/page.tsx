'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Users, Pencil, Trash2, Plus, Search, ArrowUpDown, Mail, Wallet, Coins, X } from 'lucide-react';
import { COMPANY_ABI } from '@/constants/contracts';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Types
interface Employee {
    name: string;
    email: string;
    wallet: `0x${string}`;
    salary: bigint;
    lastPaid: bigint;
    joinedAt: bigint;
    esopTokens: bigint;
    active: boolean;
    totalPaid: bigint;
}

interface AddEmployeeFormData {
    name: string;
    email: string;
    wallet: string;
    salary: string;
    esopTokens: string;
}

export default function EmployeesPage() {
    const { address } = useAccount();
    const { companyContract } = useCompanyData(address);
    const [showAddModal, setShowAddModal] = useState(false);
    const [employeesData, setEmployeesData] = useState<Employee[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isClient, setIsClient] = useState(false);


    const [formData, setFormData] = useState<AddEmployeeFormData>({
        name: '',
        email: '',
        wallet: '',
        salary: '',
        esopTokens: '',
    });

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: false,
        });
        setIsClient(true);
    }, []);

    // Initialize ethers contract
    const initContract = () => {
        if (!companyContract) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(companyContract, COMPANY_ABI, provider);
    };

    // Fetch employee data
    const fetchEmployees = async () => {
        try {
            const contract = initContract();
            if (!contract) return;

            setIsLoading(true);

            // Get all employee addresses
            const addresses = await contract.getAllEmployees();

            // Fetch details for each employee
            const employeePromises = addresses.map(async (addr: string) => {
                try {
                    const emp = await contract.employees(addr);
                    return {
                        name: emp[0],
                        email: emp[1],
                        wallet: addr as `0x${string}`,
                        salary: BigInt(emp[3].toString()),
                        lastPaid: BigInt(emp[4].toString()),
                        joinedAt: BigInt(emp[5].toString()),
                        esopTokens: BigInt(emp[6].toString()),
                        active: emp[7],
                        totalPaid: BigInt(emp[8].toString())
                    };
                } catch (error) {
                    console.error('Error fetching employee details:', error);
                    return null;
                }
            });

            const employees = await Promise.all(employeePromises);
            const activeEmployees = employees.filter((emp): emp is Employee =>
                emp !== null && emp.active
            );

            setEmployeesData(activeEmployees);
        } catch (error) {
            console.error('Error fetching employees:', error);
            toast.error('Failed to fetch employees', {
                duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
                
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch employees on mount and when contract changes
    useEffect(() => {
        if (companyContract && isClient) {
            fetchEmployees();
        }
    }, [companyContract, isClient]);


    // Handle adding new employee
    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyContract) return;

         try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(companyContract, COMPANY_ABI, signer);

            const tx = await contract.addEmployee(
                formData.name,
                formData.email,
                formData.wallet,
                parseEther(formData.salary),
                parseEther(formData.esopTokens)
            );

            await tx.wait();
            toast.success('Employee added successfully', {
                duration: 5000,
                className: 'bg-primary text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
                 
            });
            setShowAddModal(false);
            setFormData({
                name: '',
                email: '',
                wallet: '',
                salary: '',
                esopTokens: '',
            });
            fetchEmployees(); // Refresh the list
        }  catch (error: any) {
          let errorMessage = 'Failed to add employee';
            if (error?.code === 4001) {
                errorMessage = 'Transaction rejected by user.';
            } else if (error?.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for the transaction.';
            }
           toast.error(errorMessage, {
                 duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
            });
            console.error('Add employee error:', error);
        }
    };

    // Handle removing employee
      const handleRemoveEmployee = async (wallet: `0x${string}`) => {
        if (!companyContract) return;

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(companyContract, COMPANY_ABI, signer);

            const tx = await contract.removeEmployee(wallet);
            await tx.wait();

           setEmployeesData((prevEmployees) =>
                prevEmployees.filter((employee) => employee.wallet !== wallet)
            );
            toast.success('Employee removed successfully', {
                  duration: 5000,
                className: 'bg-primary text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
                 
            });
             // Refresh the list
        } catch (error: any) {
             let errorMessage = 'Failed to remove employee';
            if (error?.code === 4001) {
                errorMessage = 'Transaction rejected by user.';
            } else if (error?.message?.includes('insufficient funds')) {
                errorMessage = 'Insufficient funds for the transaction.';
            }
           toast.error(errorMessage, {
                 duration: 5000,
                className: 'bg-destructive text-white shadow-lg',
                position: 'top-center',
                closeButton: true,
            });
            console.error('Remove employee error:', error);
        }
    };


    // Filter employees based on search
    const filteredEmployees = employeesData.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.wallet.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center" data-aos="fade-down">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground">Employees</h1>
                    <p className="text-muted-foreground">Manage your team and their access</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                     data-aos="fade-left" data-aos-delay="100"
                >
                    <Plus className="w-4 h-4" />
                    Add Employee
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4"  data-aos="fade-up" data-aos-delay="100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--card-bg))] rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                    />
                </div>
                <button
                    className="px-4 py-2 bg-[hsl(var(--card-bg))] rounded-lg border border-border hover:bg-primary/10 transition-colors"
                >
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Employee List */}
            <div className="bg-[hsl(var(--card-bg))] rounded-xl overflow-hidden border border-border/5" data-aos="fade-up" data-aos-delay="200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted text-left">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold">Employee</th>
                                <th className="px-6 py-4 text-sm font-semibold">Wallet</th>
                                <th className="px-6 py-4 text-sm font-semibold">Salary</th>
                                <th className="px-6 py-4 text-sm font-semibold">ESOP Tokens</th>
                                <th className="px-6 py-4 text-sm font-semibold">Last Paid</th>
                                <th className="px-6 py-4 text-sm font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((employee, index) => (
                                    <tr key={`${employee.wallet}-${index}`} className="hover:bg-muted/50 transition-colors" data-aos="fade-up" data-aos-delay={`${300 + index * 50}`}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-foreground">{employee.name}</div>
                                                <div className="text-sm text-muted-foreground">{employee.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-sm text-foreground/80">{employee.wallet}</code>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {formatEther(employee.salary)} ETH
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {formatEther(employee.esopTokens)}
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {employee.lastPaid.toString() !== '0'
                                                ? new Date(Number(employee.lastPaid) * 1000).toLocaleDateString()
                                                : 'Not paid yet'
                                            }
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    className="p-2 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                                    onClick={() => toast.info('Edit feature coming soon!',{
                                                         duration: 5000,
                                                        className: 'bg-primary/10 text-primary  shadow-lg border border-primary/30',
                                                        position: 'top-center',
                                                         closeButton: true,
                                                    })}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                    onClick={() => handleRemoveEmployee(employee.wallet)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        {searchTerm
                                            ? 'No employees found matching your search.'
                                            : 'No employees found. Add your first employee to get started.'
                                        }
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

           {/* Add Employee Modal */}
{showAddModal && (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div
      className="bg-[hsl(var(--card-bg))] p-8 rounded-xl w-full max-w-md border border-border/5"
      data-aos="zoom-in"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Add New Employee</h2>
         
        </div>
        <button
          onClick={() => setShowAddModal(false)}
          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-destructive" />
        </button>
      </div>
      <form onSubmit={handleAddEmployee} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Name
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={formData.name}
                  style={{ paddingLeft: '35px' }}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  required
                />
              </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
             <div className="relative">
               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  value={formData.email}
                  style={{ paddingLeft: '35px' }}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                    className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  required
                />
              </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
                Wallet Address
            </label>
            <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                 <input
                    type="text"
                    style={{ paddingLeft: '35px' }}
                    value={formData.wallet}
                    onChange={(e) =>
                    setFormData((prev) => ({ ...prev, wallet: e.target.value }))
                    }
                    className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    placeholder="0x..."
                    required
                />
            </div>
          </div>
           <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Salary (ETH)
            </label>
            <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="number"
                    step="0.01"
                    style={{ paddingLeft: '35px' }}
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, salary: e.target.value }))
                    }
                    className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                    required
                  />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              ESOP Tokens
            </label>
            <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  step="0.01"
                  style={{ paddingLeft: '35px' }}
                  value={formData.esopTokens}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, esopTokens: e.target.value }))
                  }
                  className="w-full p-3 bg-[hsl(var(--muted))] rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none text-foreground"
                  required
                />
              </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowAddModal(false)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add Employee
          </button>
        </div>
      </form>
    </div>
  </div>
)}
        </div>
    );
}