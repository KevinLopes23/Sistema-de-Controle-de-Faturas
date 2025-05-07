import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  invoiceId: number;

  @ManyToOne(() => Invoice)
  @JoinColumn({ name: 'invoiceId' })
  invoice: Invoice;

  @Column()
  type: string; // VENCIMENTO, LIMITE_EXCEDIDO, etc

  @Column({ type: 'timestamp' })
  scheduleDate: Date;

  @Column({ default: false })
  sent: boolean;

  @Column({ nullable: true })
  emailTo: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;
}
