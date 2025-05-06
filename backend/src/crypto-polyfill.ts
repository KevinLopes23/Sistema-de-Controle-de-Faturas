import * as crypto from 'crypto';

// Função para gerar UUID no formato RFC4122 v4
function generateUUID(): string {
  // Gerar bytes aleatórios
  const bytes = crypto.randomBytes(16);

  // Ajustar bits de versão e variante para UUID v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC4122

  // Converter para formato de string UUID
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Definir crypto no objeto global se não existir
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}

// Adicionar método randomUUID
// Use any para evitar erros de tipagem
(global.crypto as any).randomUUID =
  typeof crypto.randomUUID === 'function' ? crypto.randomUUID : generateUUID;
