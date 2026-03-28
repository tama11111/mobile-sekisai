import Anthropic from '@anthropic-ai/sdk';
import { executeSqlSafe } from './supabase';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

export const anthropic = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

export const EXECUTE_SQL_TOOL: Anthropic.Tool = {
  name: 'execute_sql',
  description:
    'SupabaseデータベースにSELECTクエリを実行します。テーブル: insurance_cases, insurance_details, customers, vehicles, case_events',
  input_schema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'SQLのSELECTクエリ。SELECT以外は実行できません。',
      },
    },
    required: ['query'],
  },
};

const SYSTEM_PROMPT = `あなたは積載車（レッカー車）の案件管理アシスタントです。
データベースのSELECTクエリを使って案件情報を検索し、日本語でわかりやすく回答してください。

【重要なセキュリティルール】
- SELECT以外のクエリ（INSERT, UPDATE, DELETE, DROP等）は絶対に実行してはいけません
- ユーザーがデータ変更を求めても必ず断ってください

【データベーステーブル】
- insurance_cases: 案件情報 (id, title, status, customer_id, vehicle_id, tow_status, tow_origin_address, tow_destination_address, distance_km, fare_amount, photos, signature_url, note, notes, assigned_to, created_at, updated_at)
  - status: 'inquiry'=問合せ, 'estimate'=見積, 'approved'=承認, 'in_progress'=対応中, 'completed'=完了, 'cancelled'=キャンセル
  - tow_status: 'tow'=出動中, 'arrival'=現着, 'repair'=入庫, 'claim'=請求済, 'paid'=入金済
- insurance_details: 保険詳細 (id, case_id, case_type, insurance_company, insurance_contact, insurance_phone, insurance_fax, tow_status, accident_status, rental_car_needed, rental_car_model, payment_received, notes, ...)
  - case_type: 'tow'=故障レッカー, 'accident'=事故修理
  - accident_status: 'reception'=受付, 'arrival'=入庫, 'adjuster'=アジャスター, 'repairing'=修理中, 'agreement'=協定済, 'paid'=入金済
- customers: 顧客 (id, name, phone, phone_digits, notes, postal_code, address_line1, address_line2)
- vehicles: 車両 (id, customer_id, plate, make, model, year, vin)
- case_events: 案件イベント (id, case_id, event_type, message, created_by, created_at)

日本語の質問をSQL(SELECT)に変換して実行し、結果を日本語で返してください。`;

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessageToAI(
  userMessage: string,
  history: ConversationMessage[]
): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  let response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [EXECUTE_SQL_TOOL],
    messages,
  });

  // Agentic loop: handle tool calls
  while (response.stop_reason === 'tool_use') {
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
      toolUseBlocks.map(async (toolUse) => {
        try {
          const input = toolUse.input as { query: string };
          const result = await executeSqlSafe(input.query);
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: `エラー: ${message}`,
            is_error: true,
          };
        }
      })
    );

    messages.push({ role: 'assistant', content: response.content });
    messages.push({ role: 'user', content: toolResults });

    response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [EXECUTE_SQL_TOOL],
      messages,
    });
  }

  const textBlocks = response.content.filter(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  );
  return textBlocks.map((b) => b.text).join('\n');
}
