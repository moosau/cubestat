-- Ensure users can delete their own solve records
DROP POLICY IF EXISTS "Users can delete own solve records" ON public.solve_records;

CREATE POLICY "Users can delete own solve records" ON public.solve_records
  FOR DELETE USING (auth.uid() = user_id);

-- Grant delete permissions
GRANT DELETE ON public.solve_records TO authenticated;
