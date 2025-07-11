-- Fix crypto payment race condition with atomic transaction processing
-- This stored procedure prevents duplicate credit awards using advisory locks

CREATE OR REPLACE FUNCTION process_crypto_payment(
  p_transaction_hash TEXT,
  p_user_id UUID,
  p_subscriber_id BIGINT,
  p_token_symbol TEXT,
  p_token_address TEXT,
  p_chain_id INTEGER,
  p_amount TEXT,
  p_amount_wei TEXT,
  p_from_address TEXT,
  p_to_address TEXT,
  p_block_number TEXT,
  p_gas_used TEXT,
  p_confirmations INTEGER,
  p_package_credits INTEGER,
  p_chain_name TEXT
) RETURNS JSON AS $$
DECLARE
  lock_key BIGINT;
  existing_tx RECORD;
  existing_credit RECORD;
  result JSON;
BEGIN
  -- Create a lock key based on transaction hash
  lock_key := abs(hashtext(p_transaction_hash));
  
  -- Acquire advisory lock to prevent concurrent processing of same transaction
  PERFORM pg_advisory_lock(lock_key);
  
  BEGIN
    -- Check if transaction already exists
    SELECT * INTO existing_tx 
    FROM crypto_transactions 
    WHERE transaction_hash = p_transaction_hash;
    
    IF existing_tx.id IS NOT NULL THEN
      -- Transaction exists, check if credits were already awarded
      SELECT * INTO existing_credit
      FROM credit_transactions
      WHERE transaction_hash = p_transaction_hash;
      
      IF existing_credit.id IS NOT NULL THEN
        -- Credits already awarded
        result := json_build_object(
          'already_processed', true,
          'credits_awarded', existing_tx.credits_awarded
        );
      ELSE
        -- Transaction exists but no credits awarded yet, award them now
        INSERT INTO credit_transactions (
          user_id,
          credits,
          transaction_type,
          payment_method,
          amount_usd,
          transaction_hash,
          package_info
        ) VALUES (
          p_user_id,
          p_package_credits,
          'purchase',
          'crypto',
          p_amount::NUMERIC,
          p_transaction_hash,
          json_build_object(
            'token_symbol', p_token_symbol,
            'token_address', p_token_address,
            'chain_id', p_chain_id,
            'chain_name', p_chain_name,
            'from_address', p_from_address,
            'to_address', p_to_address,
            'amount_wei', p_amount_wei,
            'block_number', p_block_number,
            'confirmations', p_confirmations
          )
        );
        
        -- Update crypto transaction status
        UPDATE crypto_transactions 
        SET 
          status = 'confirmed',
          credits_awarded = p_package_credits,
          confirmations = p_confirmations,
          processed_at = NOW()
        WHERE transaction_hash = p_transaction_hash;
        
        result := json_build_object(
          'already_processed', false,
          'credits_awarded', p_package_credits
        );
      END IF;
    ELSE
      -- New transaction, insert crypto transaction and award credits
      INSERT INTO crypto_transactions (
        transaction_hash,
        user_id,
        subscriber_id,
        token_symbol,
        token_address,
        chain_id,
        amount,
        amount_wei,
        from_address,
        to_address,
        block_number,
        gas_used,
        status,
        credits_awarded,
        confirmations,
        processed_at
      ) VALUES (
        p_transaction_hash,
        p_user_id,
        p_subscriber_id,
        p_token_symbol,
        p_token_address,
        p_chain_id,
        p_amount,
        p_amount_wei,
        p_from_address,
        p_to_address,
        p_block_number,
        p_gas_used,
        'confirmed',
        p_package_credits,
        p_confirmations,
        NOW()
      );
      
      -- Award credits
      INSERT INTO credit_transactions (
        user_id,
        credits,
        transaction_type,
        payment_method,
        amount_usd,
        transaction_hash,
        package_info
      ) VALUES (
        p_user_id,
        p_package_credits,
        'purchase',
        'crypto',
        p_amount::NUMERIC,
        p_transaction_hash,
        json_build_object(
          'token_symbol', p_token_symbol,
          'token_address', p_token_address,
          'chain_id', p_chain_id,
          'chain_name', p_chain_name,
          'from_address', p_from_address,
          'to_address', p_to_address,
          'amount_wei', p_amount_wei,
          'block_number', p_block_number,
          'confirmations', p_confirmations
        )
      );
      
      result := json_build_object(
        'already_processed', false,
        'credits_awarded', p_package_credits
      );
    END IF;
    
    -- Release the advisory lock
    PERFORM pg_advisory_unlock(lock_key);
    
    RETURN result;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Release lock on any error
      PERFORM pg_advisory_unlock(lock_key);
      RAISE;
  END;
END;
$$ LANGUAGE plpgsql; 