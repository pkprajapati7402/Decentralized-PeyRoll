'use client';

import { useState } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ReactNode } from 'react';
import { pdf } from '@react-pdf/renderer';

// Define PDF styling
const styles = StyleSheet.create({
    page: {
        padding: 20, // Reduced padding for more content
        backgroundColor: '#ffffff'
    },
    header: {
        marginBottom: 15, // Reduced margin
        borderBottom: 1,
        borderColor: '#e5e7eb',
        paddingBottom: 15 // Reduced padding
    },
    logo: {
        width: 100, // Slightly smaller logo
        marginBottom: 8  // Reduced margin
    },
    title: {
        fontSize: 20, // Reduced title size
        marginBottom: 8, // Reduced margin
        color: '#111827'
    },
    subtitle: {
        fontSize: 12, // Reduced subtitle size
        color: '#6b7280',
        marginBottom: 4  // Reduced margin
    },
    section: {
        marginBottom: 12  // Reduced margin
    },
    sectionTitle: {
        fontSize: 14, // Reduced section title size
        color: '#374151',
        marginBottom: 6, // Reduced margin
        backgroundColor: '#f3f4f6',
        padding: 6
    },
    table: {
        display: 'flex',
        width: '100%',
        marginBottom: 10 // Reduced margin
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
        minHeight: 25, // Reduced row height
        alignItems: 'center'
    },
    tableHeader: {
        backgroundColor: '#f9fafb',
        padding: 6, // Reduced padding
        fontSize: 10, // Reduced header font size
        fontWeight: 'bold'
    },
    tableCell: {
        padding: 6, // Reduced padding
        fontSize: 9, // Reduced cell font size
        color: '#4b5563'
    },
      footer: {
          position: 'absolute',
          bottom: 20, // Reduced bottom position
          left: 20, // Reduced left position
          right: 20, // Reduced right position
          borderTop: 1,
          borderColor: '#e5e7eb',
          paddingTop: 10, // Reduced padding
          fontSize: 8, // Reduced footer font size
          color: '#6b7280',
          textAlign: 'center'
    }
});


// PDF Document Component
interface PayrollStatementData {
    companyName: string;
    companyEmail: string;
    companyContract: string;
    totalEmployees: number;
    totalPayroll: string;
    nextPayment: string;
    transactions: {
        timestamp: string;
        employee: string;
        amount: string;
        success: boolean;
        notes: string
    }[];
}

const PayrollStatementPDF = ({ data }: { data: PayrollStatementData }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Image src="/logo.png" style={styles.logo} />
                <Text style={styles.title}>Payroll Statement</Text>
                <Text style={styles.subtitle}>Generated on {format(new Date(), 'PPP')}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Company Information</Text>
                <Text>Company Name: {data.companyName}</Text>
                <Text>Email: {data.companyEmail}</Text>
                <Text>Contract Address: {data.companyContract}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Summary</Text>
                <Text>Total Employees: {data.totalEmployees}</Text>
                <Text>Total Monthly Payroll: {data.totalPayroll} ETH</Text>
                <Text>Next Scheduled Payment: {data.nextPayment}</Text>
            </View>

            {data.transactions.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Transaction History</Text>
                    <View style={styles.table}>
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={{ width: '25%' }}>Date</Text>
                            <Text style={{ width: '25%' }}>Employee</Text>
                            <Text style={{ width: '25%' }}>Amount (ETH)</Text>
                            <Text style={{ width: '25%' }}>Status</Text>
                        </View>
                        {data.transactions.map((tx, index) => (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: '25%' }]}>
                                    {format(new Date(Number(tx.timestamp) * 1000), 'PP')}
                                </Text>
                                <Text style={[styles.tableCell, { width: '25%' }]}>
                                    {`${tx.employee.slice(0, 6)}...${tx.employee.slice(-4)}`}
                                </Text>
                                <Text style={[styles.tableCell, { width: '25%' }]}>
                                    {tx.amount}
                                </Text>
                                <Text style={[styles.tableCell, { width: '25%' }]}>
                                    {tx.success ? 'Success' : 'Failed'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>No Transaction History</Text>
                    <Text>No payment transactions have been recorded yet.</Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text>Generated by Peyroll - Secure Blockchain Payroll Platform</Text>
                <Text>www.peyroll.com</Text>
            </View>
        </Page>
    </Document>
);

// Props interface for type safety
interface PayrollStatementProps {
    companyName: string;
    companyEmail: string;
    companyContract: string;
    totalEmployees: number;
    totalPayroll: string;
    nextPayment: string;
    transactions: any[];
}

// Main component export
export const GenerateStatement = ({ 
    companyName,
    companyEmail,
    companyContract,
    totalEmployees,
    totalPayroll,
    nextPayment,
    transactions 
}: PayrollStatementProps) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const statementData = {
        companyName,
        companyEmail,
        companyContract,
        totalEmployees,
        totalPayroll,
        nextPayment,
        transactions
    };


    const handleDownload = async () => {
        setIsGenerating(true);
       
        try {
            const pdfBlob = await pdf(<PayrollStatementPDF data={statementData} />).toBlob()
           const url = URL.createObjectURL(pdfBlob)
            const link = document.createElement('a');
            link.href = url;
            link.download = `payroll-statement-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
            document.body.appendChild(link);
            link.click();
           document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } catch (e) {
            console.log(e);
        } finally {
            setIsGenerating(false)
        }
    }
    return (
        <div className="relative inline-block">
             <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
                {isGenerating ? (
                     <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <FileText className="w-4 h-4" />
                        Generate Statement
                    </>
                )}
            </button>
        </div>
    );
};