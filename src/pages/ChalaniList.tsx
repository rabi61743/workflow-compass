import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockChalaniLetters } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, ExternalLink, Building2 } from 'lucide-react';

export default function ChalaniList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [receiverTypeFilter, setReceiverTypeFilter] = useState<string>('all');

  const filteredLetters = mockChalaniLetters.filter((letter) => {
    const matchesSearch =
      letter.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.chalaniNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      letter.receiverOrg.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || letter.status === statusFilter;
    const matchesReceiverType = receiverTypeFilter === 'all' || letter.receiverType === receiverTypeFilter;

    return matchesSearch && matchesStatus && matchesReceiverType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Draft</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'closed':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Dispatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReceiverTypeBadge = (type: string) => {
    if (type === 'internal') {
      return (
        <Badge variant="outline" className="gap-1">
          <Building2 className="h-3 w-3" />
          Internal
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <ExternalLink className="h-3 w-3" />
        External
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chalani (Outgoing Letters)</h1>
          <p className="text-muted-foreground">
            Create and manage outgoing correspondence
          </p>
        </div>
        <Button onClick={() => navigate('/chalani/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Chalani
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter outgoing letters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject, chalani number, or receiver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="closed">Dispatched</SelectItem>
                </SelectContent>
              </Select>
              <Select value={receiverTypeFilter} onValueChange={setReceiverTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Receiver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Receivers</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">Chalani No.</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[120px]">Created</TableHead>
                <TableHead className="w-[80px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No letters found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLetters.map((letter) => (
                  <TableRow
                    key={letter.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/chalani/${letter.id}`)}
                  >
                    <TableCell className="font-medium">{letter.chalaniNumber}</TableCell>
                    <TableCell>
                      <span className="line-clamp-1">{letter.subject}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {letter.receiverOrg}
                    </TableCell>
                    <TableCell>{getReceiverTypeBadge(letter.receiverType)}</TableCell>
                    <TableCell>{getStatusBadge(letter.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(letter.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chalani/${letter.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
