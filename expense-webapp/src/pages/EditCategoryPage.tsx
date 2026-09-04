import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heading } from "@astryxdesign/core/Heading";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { TextInput } from "@astryxdesign/core/TextInput";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Button } from "@astryxdesign/core/Button";
import { HStack, VStack } from "@astryxdesign/core/Stack";
import { Banner } from "@astryxdesign/core/Banner";
import { Spinner } from "@astryxdesign/core/Spinner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api";

export default function EditCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const isNew = !categoryId;
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [limitUsd, setLimitUsd] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew || !categoryId) return;
    listCategories()
      .then((res) => {
        const category = res.data.find((c) => c.id === categoryId);
        if (!category) {
          setError("This category could not be found.");
          return;
        }
        setName(category.name);
        setLimitUsd(category.limitUsd ?? null);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load category."),
      )
      .finally(() => setIsLoading(false));
  }, [categoryId, isNew]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      if (isNew) {
        await createCategory({ name: name.trim(), limitUsd });
      } else if (categoryId) {
        await updateCategory(categoryId, { name: name.trim(), limitUsd });
      }
      navigate("/categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category.");
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!categoryId) return;
    setIsDeleting(true);
    try {
      await deleteCategory(categoryId);
      navigate("/categories");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete category.");
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  }

  if (isLoading) {
    return <Spinner label="Loading category…" />;
  }

  return (
    <VStack gap={4} maxWidth={480}>
      <Heading level={1}>Category Details</Heading>
      {error && <Banner status="error" title={error} />}
      <FormLayout direction="vertical">
        <TextInput label="Category Name" value={name} onChange={setName} isRequired />
        <NumberInput
          label="Monthly Limit (USD)"
          value={limitUsd}
          onChange={setLimitUsd}
          min={0}
          step={1}
          hasClear
          isOptional
          units="USD"
        />
      </FormLayout>
      <HStack justify={isNew ? "end" : "between"}>
        {!isNew && (
          <Button
            label="Delete"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
          />
        )}
        <HStack gap={2}>
          <Button
            label="Cancel"
            variant="secondary"
            onClick={() => navigate("/categories")}
          />
          <Button
            label="Save Category"
            variant="primary"
            isLoading={isSaving}
            clickAction={handleSave}
          />
        </HStack>
      </HStack>
      <AlertDialog
        isOpen={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Delete this category?"
        description="Expenses already logged under it are unaffected, but you won't be able to log new ones against it. This cannot be undone."
        actionLabel="Delete category"
        isActionLoading={isDeleting}
        onAction={handleDelete}
      />
    </VStack>
  );
}
