import { type Address } from 'viem';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { realTokenService, type TransferEvent } from './realTokenService';
import {
  realEscrowService,
  type LockCreatedEvent,
  type WithdrawEvent,
} from './realEscrowService';
import {
  realVotingService,
  type VotedEvent,
  type AbstainedEvent,
} from './realVotingService';
import {
  realExitQueueService,
  type QueueEnteredEvent,
  type QueueExitedEvent,
  type ClaimedFromQueueEvent,
} from './realExitQueueService';

export enum EventType {
  // Token events
  TOKEN_TRANSFER = 'token_transfer',
  TOKEN_APPROVAL = 'token_approval',

  // Escrow events
  LOCK_CREATED = 'lock_created',
  LOCK_WITHDRAWN = 'lock_withdrawn',

  // Voting events
  VOTE_CAST = 'vote_cast',
  VOTE_RESET = 'vote_reset',
  VOTE_FINALIZED = 'vote_finalized',
  WINNER_ANNOUNCED = 'winner_announced',

  // Exit queue events
  QUEUE_ENTERED = 'queue_entered',
  QUEUE_EXITED = 'queue_exited',
  QUEUE_CLAIMED = 'queue_claimed',
}

export interface ContractEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  blockNumber?: bigint;
  transactionHash?: string;
  data: any;
  processed: boolean;
}

export interface EventState {
  events: Record<string, ContractEvent>;
  recentEvents: string[];
  unprocessedEvents: string[];
  subscriptions: Record<string, () => void>;
  isMonitoring: boolean;
}

export interface EventActions {
  addEvent: (
    event: Omit<ContractEvent, 'id' | 'timestamp' | 'processed'>
  ) => string;
  markEventProcessed: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  clearOldEvents: (olderThanHours?: number) => void;
  getRecentEvents: (limit?: number) => ContractEvent[];
  getEventsByType: (type: EventType) => ContractEvent[];
  getUnprocessedEvents: () => ContractEvent[];
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
}

export type EventStore = EventState & EventActions;

// Create the event store
export const useEventStore = create<EventStore>()(
  subscribeWithSelector((set, get) => ({
    events: {},
    recentEvents: [],
    unprocessedEvents: [],
    subscriptions: {},
    isMonitoring: false,

    addEvent: eventData => {
      const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const event: ContractEvent = {
        ...eventData,
        id,
        timestamp: new Date(),
        processed: false,
      };

      set(state => ({
        events: {
          ...state.events,
          [id]: event,
        },
        recentEvents: [id, ...state.recentEvents.slice(0, 99)], // Keep last 100
        unprocessedEvents: [...state.unprocessedEvents, id],
      }));

      return id;
    },

    markEventProcessed: eventId => {
      set(state => {
        const event = state.events[eventId];
        if (!event) return state;

        return {
          events: {
            ...state.events,
            [eventId]: { ...event, processed: true },
          },
          unprocessedEvents: state.unprocessedEvents.filter(
            id => id !== eventId
          ),
        };
      });
    },

    removeEvent: eventId => {
      set(state => {
        const { [eventId]: removed, ...remainingEvents } = state.events;
        return {
          events: remainingEvents,
          recentEvents: state.recentEvents.filter(id => id !== eventId),
          unprocessedEvents: state.unprocessedEvents.filter(
            id => id !== eventId
          ),
        };
      });
    },

    clearOldEvents: (olderThanHours = 24) => {
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      set(state => {
        const filteredEvents: Record<string, ContractEvent> = {};
        const filteredRecent: string[] = [];
        const filteredUnprocessed: string[] = [];

        Object.entries(state.events).forEach(([id, event]) => {
          if (event.timestamp > cutoffTime || !event.processed) {
            filteredEvents[id] = event;
            if (state.recentEvents.includes(id)) {
              filteredRecent.push(id);
            }
            if (state.unprocessedEvents.includes(id)) {
              filteredUnprocessed.push(id);
            }
          }
        });

        return {
          events: filteredEvents,
          recentEvents: filteredRecent,
          unprocessedEvents: filteredUnprocessed,
        };
      });
    },

    getRecentEvents: (limit = 20) => {
      const { events, recentEvents } = get();
      return recentEvents
        .slice(0, limit)
        .map(id => events[id])
        .filter(Boolean);
    },

    getEventsByType: type => {
      const { events } = get();
      return Object.values(events).filter(event => event.type === type);
    },

    getUnprocessedEvents: () => {
      const { events, unprocessedEvents } = get();
      return unprocessedEvents.map(id => events[id]).filter(Boolean);
    },

    startMonitoring: async () => {
      const state = get();
      if (state.isMonitoring) return;

      set({ isMonitoring: true });

      try {
        // Start all event subscriptions
        const subscriptions =
          await EventMonitor.getInstance().startAllSubscriptions();
        set({ subscriptions });
      } catch (error) {
        console.error('Error starting event monitoring:', error);
        set({ isMonitoring: false });
        throw error;
      }
    },

    stopMonitoring: () => {
      const { subscriptions } = get();

      // Unsubscribe from all events
      Object.values(subscriptions).forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from event:', error);
        }
      });

      set({
        isMonitoring: false,
        subscriptions: {},
      });
    },
  }))
);

// Event Monitor Class
export class EventMonitor {
  private static instance: EventMonitor;

  private constructor() {}

  static getInstance(): EventMonitor {
    if (!EventMonitor.instance) {
      EventMonitor.instance = new EventMonitor();
    }
    return EventMonitor.instance;
  }

  /**
   * Start all event subscriptions
   */
  async startAllSubscriptions(): Promise<Record<string, () => void>> {
    const subscriptions: Record<string, () => void> = {};

    try {
      // Token events
      subscriptions.tokenTransfer = await this.subscribeToTokenTransfers();
      subscriptions.tokenApproval = await this.subscribeToTokenApprovals();

      // Escrow events
      subscriptions.lockCreated = await this.subscribeToLockEvents();
      subscriptions.lockWithdrawn = await this.subscribeToWithdrawEvents();

      // Voting events
      subscriptions.votesCast = await this.subscribeToVotingEvents();
      subscriptions.votesReset = await this.subscribeToVoteResetEvents();
      subscriptions.voteFinalized = await this.subscribeToVoteFinalizedEvents();
      subscriptions.winnerAnnounced =
        await this.subscribeToWinnerAnnouncedEvents();

      // Exit queue events
      subscriptions.queueEntered = await this.subscribeToQueueEnteredEvents();
      subscriptions.queueExited = await this.subscribeToQueueExitedEvents();
      subscriptions.queueClaimed = await this.subscribeToQueueClaimedEvents();

      console.log('All event subscriptions started successfully');
      return subscriptions;
    } catch (error) {
      console.error('Error starting event subscriptions:', error);

      // Clean up any successful subscriptions
      Object.values(subscriptions).forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
      });

      throw error;
    }
  }

  /**
   * Subscribe to token transfer events
   */
  private async subscribeToTokenTransfers(): Promise<() => void> {
    return await realTokenService.subscribeToTransferEvents(
      (event: { from: Address; to: Address; value: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.TOKEN_TRANSFER,
          data: {
            from: event.from,
            to: event.to,
            value: event.value.toString(),
          },
        });

        // Emit custom event for UI updates
        this.emitUIEvent('tokenTransfer', event);
      }
    );
  }

  /**
   * Subscribe to token approval events
   */
  private async subscribeToTokenApprovals(): Promise<() => void> {
    return await realTokenService.subscribeToApprovalEvents(
      (event: { owner: Address; spender: Address; value: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.TOKEN_APPROVAL,
          data: {
            owner: event.owner,
            spender: event.spender,
            value: event.value.toString(),
          },
        });

        this.emitUIEvent('tokenApproval', event);
      }
    );
  }

  /**
   * Subscribe to lock creation events
   */
  private async subscribeToLockEvents(): Promise<() => void> {
    return await realEscrowService.subscribeToLockEvents(
      (event: {
        provider: Address;
        tokenId: bigint;
        value: bigint;
        locktime: bigint;
      }) => {
        useEventStore.getState().addEvent({
          type: EventType.LOCK_CREATED,
          data: {
            provider: event.provider,
            tokenId: event.tokenId.toString(),
            value: event.value.toString(),
            locktime: event.locktime.toString(),
          },
        });

        this.emitUIEvent('lockCreated', event);
      }
    );
  }

  /**
   * Subscribe to lock withdrawal events
   */
  private async subscribeToWithdrawEvents(): Promise<() => void> {
    return await realEscrowService.subscribeToWithdrawEvents(
      (event: { provider: Address; tokenId: bigint; value: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.LOCK_WITHDRAWN,
          data: {
            provider: event.provider,
            tokenId: event.tokenId.toString(),
            value: event.value.toString(),
          },
        });

        this.emitUIEvent('lockWithdrawn', event);
      }
    );
  }

  /**
   * Subscribe to voting events
   */
  private async subscribeToVotingEvents(): Promise<() => void> {
    return await realVotingService.subscribeToVoteEvents(
      (event: { user: Address; gauge: Address; weight: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.VOTE_CAST,
          data: {
            voter: event.user,
            gauge: event.gauge,
            weight: event.weight.toString(),
          },
        });

        this.emitUIEvent('voteCast', event);
      }
    );
  }

  /**
   * Subscribe to vote reset events
   */
  private async subscribeToVoteResetEvents(): Promise<() => void> {
    return await realVotingService.subscribeToVoteEvents(
      (event: { user: Address; gauge: Address; weight: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.VOTE_RESET,
          data: {
            voter: event.user,
            gauge: event.gauge,
          },
        });

        this.emitUIEvent('voteReset', event);
      }
    );
  }

  /**
   * Subscribe to vote finalized events
   */
  private async subscribeToVoteFinalizedEvents(): Promise<() => void> {
    return await realVotingService.subscribeToVoteEvents(
      (event: { user: Address; gauge: Address; weight: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.VOTE_FINALIZED,
          data: {
            voter: event.user,
            gauge: event.gauge,
          },
        });

        this.emitUIEvent('voteFinalized', event);
      }
    );
  }

  /**
   * Subscribe to winner announced events
   */
  private async subscribeToWinnerAnnouncedEvents(): Promise<() => void> {
    return await realVotingService.subscribeToVoteEvents(
      (event: { user: Address; gauge: Address; weight: bigint }) => {
        useEventStore.getState().addEvent({
          type: EventType.WINNER_ANNOUNCED,
          data: {
            voter: event.user,
            gauge: event.gauge,
          },
        });

        this.emitUIEvent('winnerAnnounced', event);
      }
    );
  }

  /**
   * Subscribe to queue entered events
   */
  private async subscribeToQueueEnteredEvents(): Promise<() => void> {
    return await realExitQueueService.subscribeToJoinQueueEvents(
      (event: { tokenId: bigint; owner: Address }) => {
        useEventStore.getState().addEvent({
          type: EventType.QUEUE_ENTERED,
          data: {
            tokenId: event.tokenId.toString(),
            owner: event.owner,
          },
        });

        this.emitUIEvent('queueEntered', event);
      }
    );
  }

  /**
   * Subscribe to queue exited events
   */
  private async subscribeToQueueExitedEvents(): Promise<() => void> {
    return await realExitQueueService.subscribeToLeaveQueueEvents(
      (event: { tokenId: bigint; owner: Address }) => {
        useEventStore.getState().addEvent({
          type: EventType.QUEUE_EXITED,
          data: {
            tokenId: event.tokenId.toString(),
            owner: event.owner,
          },
        });

        this.emitUIEvent('queueExited', event);
      }
    );
  }

  /**
   * Subscribe to queue claimed events
   */
  private async subscribeToQueueClaimedEvents(): Promise<() => void> {
    return await realExitQueueService.subscribeToLeaveQueueEvents(
      (event: { tokenId: bigint; owner: Address }) => {
        useEventStore.getState().addEvent({
          type: EventType.QUEUE_CLAIMED,
          data: {
            tokenId: event.tokenId.toString(),
            owner: event.owner,
          },
        });

        this.emitUIEvent('queueClaimed', event);
      }
    );
  }

  /**
   * Emit custom UI events for components to listen to
   */
  private emitUIEvent(eventName: string, data: any): void {
    window.dispatchEvent(
      new CustomEvent(`contract:${eventName}`, {
        detail: data,
      })
    );
  }

  /**
   * Process unprocessed events
   */
  async processUnprocessedEvents(): Promise<void> {
    const unprocessedEvents = useEventStore.getState().getUnprocessedEvents();

    for (const event of unprocessedEvents) {
      try {
        await this.processEvent(event);
        useEventStore.getState().markEventProcessed(event.id);
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
      }
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: ContractEvent): Promise<void> {
    switch (event.type) {
      case EventType.TOKEN_TRANSFER:
        await this.processTokenTransferEvent(event);
        break;
      case EventType.LOCK_CREATED:
        await this.processLockCreatedEvent(event);
        break;
      case EventType.VOTE_CAST:
        await this.processVoteCastEvent(event);
        break;
      case EventType.VOTE_FINALIZED:
        await this.processVoteFinalizedEvent(event);
        break;
      case EventType.WINNER_ANNOUNCED:
        await this.processWinnerAnnouncedEvent(event);
        break;
      case EventType.QUEUE_ENTERED:
        await this.processQueueEnteredEvent(event);
        break;
      // Add more event processors as needed
      default:
        console.log(`No processor for event type: ${event.type}`);
    }
  }

  /**
   * Process token transfer events
   */
  private async processTokenTransferEvent(event: ContractEvent): Promise<void> {
    // Update relevant stores or trigger UI updates
    console.log('Processing token transfer event:', event.data);

    // Example: Refresh user balance if they're involved in the transfer
    // This would trigger store updates or component refreshes
  }

  /**
   * Process lock created events
   */
  private async processLockCreatedEvent(event: ContractEvent): Promise<void> {
    console.log('Processing lock created event:', event.data);

    // Example: Refresh user's locks if they created a new lock
    // This would update the escrow store or trigger component refreshes
  }

  /**
   * Process vote cast events
   */
  private async processVoteCastEvent(event: ContractEvent): Promise<void> {
    console.log('Processing vote cast event:', event.data);

    // Example: Refresh voting data and gauge information
  }

  /**
   * Process vote finalized events
   */
  private async processVoteFinalizedEvent(event: ContractEvent): Promise<void> {
    console.log('Processing vote finalized event:', event.data);

    // Example: Refresh voting data and gauge information
  }

  /**
   * Process winner announced events
   */
  private async processWinnerAnnouncedEvent(
    event: ContractEvent
  ): Promise<void> {
    console.log('Processing winner announced event:', event.data);

    // Example: Refresh voting data and gauge information
  }

  /**
   * Process queue entered events
   */
  private async processQueueEnteredEvent(event: ContractEvent): Promise<void> {
    console.log('Processing queue entered event:', event.data);

    // Example: Refresh exit queue data
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    total: number;
    processed: number;
    unprocessed: number;
    byType: Record<EventType, number>;
  } {
    const events = Object.values(useEventStore.getState().events);
    const byType: Record<EventType, number> = {} as Record<EventType, number>;

    // Initialize counters
    Object.values(EventType).forEach(type => {
      byType[type] = 0;
    });

    // Count events by type
    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
    });

    return {
      total: events.length,
      processed: events.filter(e => e.processed).length,
      unprocessed: events.filter(e => !e.processed).length,
      byType,
    };
  }

  /**
   * Clean up old events
   */
  cleanup(olderThanHours = 24): void {
    useEventStore.getState().clearOldEvents(olderThanHours);
  }
}

// Export singleton instance
export const eventMonitor = EventMonitor.getInstance();

// Helper functions for event type descriptions
export const getEventTypeDescription = (type: EventType): string => {
  const descriptions: Record<EventType, string> = {
    [EventType.TOKEN_TRANSFER]: 'Token Transfer',
    [EventType.TOKEN_APPROVAL]: 'Token Approval',
    [EventType.LOCK_CREATED]: 'Lock Created',
    [EventType.LOCK_WITHDRAWN]: 'Lock Withdrawn',
    [EventType.VOTE_CAST]: 'Vote Cast',
    [EventType.VOTE_RESET]: 'Vote Reset',
    [EventType.VOTE_FINALIZED]: 'Vote Finalized',
    [EventType.WINNER_ANNOUNCED]: 'Winner Announced',
    [EventType.QUEUE_ENTERED]: 'Queue Entered',
    [EventType.QUEUE_EXITED]: 'Queue Exited',
    [EventType.QUEUE_CLAIMED]: 'Queue Claimed',
  };

  return descriptions[type] || 'Unknown Event';
};

// Helper function to get event icon
export const getEventTypeIcon = (type: EventType): string => {
  const icons: Record<EventType, string> = {
    [EventType.TOKEN_TRANSFER]: '💸',
    [EventType.TOKEN_APPROVAL]: '✅',
    [EventType.LOCK_CREATED]: '🔒',
    [EventType.LOCK_WITHDRAWN]: '🔓',
    [EventType.VOTE_CAST]: '🗳️',
    [EventType.VOTE_RESET]: '🔄',
    [EventType.VOTE_FINALIZED]: '🏁',
    [EventType.WINNER_ANNOUNCED]: '🏆',
    [EventType.QUEUE_ENTERED]: '⏳',
    [EventType.QUEUE_EXITED]: '❌',
    [EventType.QUEUE_CLAIMED]: '💰',
  };

  return icons[type] || '📋';
};
