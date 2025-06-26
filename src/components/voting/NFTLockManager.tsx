'use client';

import React, { useState, useCallback } from 'react';
import { Address } from 'viem';
import { formatEther, parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Progress } from '@/components/ui';
import { Separator } from '@/components/ui';
import { useNFTLocks, NFTLock, NFTLockHistory } from '@/hooks/useNFTLocks';
import { useToast } from '@/hooks/useToast';
import {
  Lock,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowRightLeft,
  Users,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Timer,
  Coins,
  Image as ImageIcon,
  Copy,
  Send,
  Plus,
  Minus,
  Calendar,
  BarChart3,
  Zap,
  Shield,
} from 'lucide-react';

interface NFTLockCardProps {
  lock: NFTLock;
  onIncreaseLock: (tokenId: number, amount: bigint) => void;
  onIncreaseDuration: (tokenId: number, newEnd: number) => void;
  onEnterExitQueue: (tokenId: number) => void;
  onClaimFromQueue: (tokenId: number) => void;
  onTransferLock: (tokenId: number, to: Address) => void;
  onViewHistory: (tokenId: number) => void;
  isTransferEnabled: boolean;
}

const NFTLockCard: React.FC<NFTLockCardProps> = ({
  lock,
  onIncreaseLock,
  onIncreaseDuration,
  onEnterExitQueue,
  onClaimFromQueue,
  onTransferLock,
  onViewHistory,
  isTransferEnabled,
}) => {
  const [showIncreaseAmount, setShowIncreaseAmount] = useState(false);
  const [showIncreaseDuration, setShowIncreaseDuration] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const { success, error: showError } = useToast();

  const isExpired = Date.now() / 1000 > lock.lockEnd;
  const timeRemaining = Math.max(0, lock.lockEnd - Date.now() / 1000);
  const daysRemaining = Math.floor(timeRemaining / (24 * 60 * 60));
  const hoursRemaining = Math.floor(
    (timeRemaining % (24 * 60 * 60)) / (60 * 60)
  );

  const handleIncreaseAmount = useCallback(async () => {
    if (!increaseAmount) return;
    try {
      await onIncreaseLock(lock.tokenId, parseEther(increaseAmount));
      setIncreaseAmount('');
      setShowIncreaseAmount(false);
      success('Lock amount increased', 'Lock amount increased successfully');
    } catch (err) {
      showError('Error', 'Failed to increase lock amount');
    }
  }, [increaseAmount, lock.tokenId, onIncreaseLock, success, showError]);

  const handleIncreaseDuration = useCallback(async () => {
    if (!newDuration) return;
    try {
      const newEndTime =
        Math.floor(Date.now() / 1000) + parseInt(newDuration) * 24 * 60 * 60;
      await onIncreaseDuration(lock.tokenId, newEndTime);
      setNewDuration('');
      setShowIncreaseDuration(false);
      success(
        'Lock duration increased',
        'Lock duration increased successfully'
      );
    } catch (err) {
      showError('Error', 'Failed to increase lock duration');
    }
  }, [newDuration, lock.tokenId, onIncreaseDuration, success, showError]);

  const handleTransfer = useCallback(async () => {
    if (!transferAddress) return;
    try {
      await onTransferLock(lock.tokenId, transferAddress as Address);
      setTransferAddress('');
      setShowTransfer(false);
      success(
        'NFT Lock Transferred',
        'The NFT lock has been transferred successfully.'
      );
    } catch (err) {
      showError('Error', 'Failed to transfer lock');
    }
  }, [transferAddress, lock.tokenId, onTransferLock, success, showError]);

  const copyTokenId = useCallback(() => {
    navigator.clipboard.writeText(lock.tokenId.toString());
    success('Copied', 'Token ID copied to clipboard');
  }, [lock.tokenId, success]);

  const copyOwnerAddress = useCallback(() => {
    navigator.clipboard.writeText(lock.owner);
    success('Copied', 'Owner address copied to clipboard');
  }, [lock.owner, success]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            NFT Lock #{lock.tokenId}
            <Button
              variant="ghost"
              size="sm"
              onClick={copyTokenId}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!lock.isWarmupComplete && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Warmup
              </Badge>
            )}
            {lock.exitQueuePosition !== undefined && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Queue #{lock.exitQueuePosition}
              </Badge>
            )}
            {isExpired && <Badge variant="error">Expired</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* NFT Metadata Display */}
        {lock.metadata && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            {lock.metadata.image ? (
              <img
                src={lock.metadata.image}
                alt={lock.metadata.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted-foreground/20 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h4 className="font-medium">{lock.metadata.name}</h4>
              <p className="text-sm text-muted-foreground">
                {lock.metadata.description}
              </p>
            </div>
          </div>
        )}

        {/* Lock Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Coins className="h-4 w-4" />
              Locked Amount
            </Label>
            <p className="text-2xl font-bold">{formatEther(lock.amount)} VMF</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Zap className="h-4 w-4" />
              Voting Power
            </Label>
            <p className="text-2xl font-bold">
              {formatEther(lock.votingPower)}
            </p>
          </div>
        </div>

        {/* Time Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Lock Duration
          </Label>
          {isExpired ? (
            <Badge variant="error">Expired</Badge>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {daysRemaining}d {hoursRemaining}h remaining
              </p>
              <Progress
                value={
                  ((lock.lockEnd - Date.now() / 1000) /
                    (lock.lockEnd - lock.createdAt.getTime() / 1000)) *
                  100
                }
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* Owner Information */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Owner
          </Label>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {lock.owner.slice(0, 6)}...{lock.owner.slice(-4)}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyOwnerAddress}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Exit Queue Status */}
        {lock.exitQueuePosition !== undefined && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {lock.canWithdraw
                ? 'Ready to withdraw from exit queue'
                : `Position #${lock.exitQueuePosition} in exit queue`}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isExpired && lock.exitQueuePosition === undefined && (
            <>
              <Dialog
                open={showIncreaseAmount}
                onOpenChange={setShowIncreaseAmount}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Increase Amount
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Increase Lock Amount</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Additional Amount (VMF)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={increaseAmount}
                        onChange={e => setIncreaseAmount(e.target.value)}
                        placeholder="0.0"
                      />
                    </div>
                    <Button onClick={handleIncreaseAmount} className="w-full">
                      Increase Amount
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={showIncreaseDuration}
                onOpenChange={setShowIncreaseDuration}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    Extend Duration
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Extend Lock Duration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="duration">Additional Days</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={newDuration}
                        onChange={e => setNewDuration(e.target.value)}
                        placeholder="30"
                      />
                    </div>
                    <Button onClick={handleIncreaseDuration} className="w-full">
                      Extend Duration
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {lock.exitQueuePosition === undefined && !isExpired && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEnterExitQueue(lock.tokenId)}
              disabled={isExpired}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Enter Exit Queue
            </Button>
          )}

          {lock.canWithdraw && (
            <Button
              onClick={() => onClaimFromQueue(lock.tokenId)}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Claim Tokens
            </Button>
          )}

          {isTransferEnabled && lock.transferable && (
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  Transfer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer NFT Lock</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Recipient Address</Label>
                    <Input
                      id="address"
                      value={transferAddress}
                      onChange={e => setTransferAddress(e.target.value)}
                      placeholder="0x..."
                    />
                  </div>
                  <Button onClick={handleTransfer} className="w-full">
                    Transfer Lock
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewHistory(lock.tokenId)}
            className="flex items-center gap-1"
          >
            <BarChart3 className="h-3 w-3" />
            History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface NFTLockHistoryModalProps {
  tokenId: number | null;
  history: NFTLockHistory[];
  isOpen: boolean;
  onClose: () => void;
}

const NFTLockHistoryModal: React.FC<NFTLockHistoryModalProps> = ({
  tokenId,
  history,
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lock History - NFT #{tokenId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No history available for this lock
            </p>
          ) : (
            history.map((event, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {event.action.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {event.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  {event.amount && (
                    <p className="text-sm text-muted-foreground">
                      Amount: {formatEther(event.amount)} VMF
                    </p>
                  )}
                  {event.from && event.to && (
                    <p className="text-sm text-muted-foreground">
                      From: {event.from.slice(0, 6)}...{event.from.slice(-4)} →
                      To: {event.to.slice(0, 6)}...{event.to.slice(-4)}
                    </p>
                  )}
                  <a
                    href={`https://etherscan.io/tx/${event.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View Transaction <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const NFTLockManager: React.FC = () => {
  const {
    locks,
    isLoading,
    error,
    createLock,
    increaseLock,
    increaseLockDuration,
    enterExitQueue,
    claimFromQueue,
    transferLock,
    getLockHistory,
    refreshLocks,
    isTransferEnabled,
    totalVotingPower,
    totalLockedAmount,
  } = useNFTLocks();

  const [selectedHistory, setSelectedHistory] = useState<{
    tokenId: number;
    history: NFTLockHistory[];
  } | null>(null);
  const [showCreateLock, setShowCreateLock] = useState(false);
  const [createAmount, setCreateAmount] = useState('');
  const [createDuration, setCreateDuration] = useState('');
  const { success, error: showError } = useToast();

  const handleViewHistory = useCallback(
    async (tokenId: number) => {
      try {
        const history = await getLockHistory(tokenId);
        setSelectedHistory({ tokenId, history });
      } catch (error) {
        showError('Error', 'Failed to load lock history');
      }
    },
    [getLockHistory, showError]
  );

  const handleCreateLock = useCallback(async () => {
    if (!createAmount || !createDuration) return;

    try {
      const duration = parseInt(createDuration) * 24 * 60 * 60; // Convert days to seconds
      await createLock(parseEther(createAmount), duration);
      setCreateAmount('');
      setCreateDuration('');
      setShowCreateLock(false);
      success('Lock Created', 'Your NFT lock has been created successfully!');
    } catch (error) {
      showError('Error', 'Failed to create lock');
    }
  }, [createAmount, createDuration, createLock, success, showError]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error loading NFT locks: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">NFT Lock Portfolio</h2>
          <p className="text-muted-foreground">
            Manage your veNFT locks and voting power
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={refreshLocks} disabled={isLoading}>
            Refresh
          </Button>
          <Dialog open={showCreateLock} onOpenChange={setShowCreateLock}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Create Lock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Lock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-amount">Amount (VMF)</Label>
                  <Input
                    id="create-amount"
                    type="number"
                    value={createAmount}
                    onChange={e => setCreateAmount(e.target.value)}
                    placeholder="100.0"
                  />
                </div>
                <div>
                  <Label htmlFor="create-duration">Duration (Days)</Label>
                  <Input
                    id="create-duration"
                    type="number"
                    value={createDuration}
                    onChange={e => setCreateDuration(e.target.value)}
                    placeholder="365"
                  />
                </div>
                <Button onClick={handleCreateLock} className="w-full">
                  Create Lock
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Locked
                </p>
                <p className="text-2xl font-bold">
                  {formatEther(totalLockedAmount)} VMF
                </p>
              </div>
              <Coins className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Voting Power
                </p>
                <p className="text-2xl font-bold">
                  {formatEther(totalVotingPower)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Locks
                </p>
                <p className="text-2xl font-bold">{locks.length}</p>
              </div>
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Status */}
      {!isTransferEnabled && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            NFT transfers are currently disabled. Contact the DAO to enable
            transfers.
          </AlertDescription>
        </Alert>
      )}

      {/* Locks Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-8 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : locks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No NFT Locks Found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first lock to start earning voting power
            </p>
            <Button onClick={() => setShowCreateLock(true)}>
              Create Your First Lock
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locks.map(lock => (
            <NFTLockCard
              key={lock.tokenId}
              lock={lock}
              onIncreaseLock={increaseLock}
              onIncreaseDuration={increaseLockDuration}
              onEnterExitQueue={enterExitQueue}
              onClaimFromQueue={claimFromQueue}
              onTransferLock={transferLock}
              onViewHistory={handleViewHistory}
              isTransferEnabled={isTransferEnabled}
            />
          ))}
        </div>
      )}

      {/* History Modal */}
      <NFTLockHistoryModal
        tokenId={selectedHistory?.tokenId || null}
        history={selectedHistory?.history || []}
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
      />
    </div>
  );
};
