import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

from notebook_workflow import CLASSES, FOLDERS, metrics_for, prepare_dataset


class WorkflowTests(unittest.TestCase):
    def test_saved_augmentation_cannot_cross_holdouts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            rng = np.random.default_rng(19)
            for label, folder in zip(CLASSES, FOLDERS):
                (root / folder).mkdir()
                for split in ('train', 'validation', 'test'):
                    target = root / 'balanced_dataset' / split / label
                    target.mkdir(parents=True)
                    image = Image.fromarray(rng.integers(0, 255, (180, 180, 3), dtype=np.uint8))
                    image.save(target / 'original.png')
                    image.save(root / folder / f'{split}.png')
                # Identical pixels with different encoding must still stay in test only.
                with Image.open(root / folder / 'test.png') as image:
                    image.save(root / 'balanced_dataset/train' / label / 'duplicate.png', compress_level=0)
            output, manifest = prepare_dataset(root, target=3)
            self.assertEqual(len(manifest['repaired_pixel_duplicate_leakage']), 4)
            parent_splits = {}
            for row in manifest['files']:
                split = Path(row['file']).parts[0]
                parent_splits.setdefault(row['parent'], set()).add(split)
                if row['augmented']:
                    self.assertEqual(split, 'train')
            self.assertTrue(all(len(splits) == 1 for splits in parent_splits.values()))
            self.assertEqual(manifest['counts']['train']['Healthy']['total'], 3)
            self.assertEqual(manifest['counts']['test']['Healthy']['total'], 1)
            self.assertEqual(prepare_dataset(root, target=3)[0], output)
            with Image.open(root / FOLDERS[0] / 'train.png') as image:
                image.save(root / FOLDERS[1] / 'conflict.png')
            # Conflicting labels are excluded without deleting source files.
            with Image.open(root / FOLDERS[0] / 'validation.png') as image:
                changed = np.asarray(image).copy()
                changed[0, 0] = 0
                Image.fromarray(changed).save(root / FOLDERS[0] / 'extra.png')
            _, reviewed = prepare_dataset(root, target=3)
            self.assertEqual(len(reviewed['excluded_conflicting_labels']), 2)
            self.assertTrue((root / FOLDERS[1] / 'conflict.png').exists())

    def test_metrics_include_misclassified_examples(self):
        report = metrics_for([0, 0, 1, 2, 3], [0, 1, 1, 2, 3])
        self.assertEqual(report['accuracy'], .8)
        self.assertAlmostEqual(report['per_class']['Healthy']['f1'], 2 / 3)
        self.assertEqual(sum(map(sum, report['confusion_matrix'])), 5)

    def test_curated_dataset_never_restores_legacy_images(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'dataset_review.json').write_text('[]')
            rng = np.random.default_rng(123)
            for folder in FOLDERS:
                (root / folder).mkdir()
                for index in range(10):
                    Image.fromarray(rng.integers(0, 255, (180, 180, 3), dtype=np.uint8)).save(root / folder / f'{index}.png')
            legacy = root / 'balanced_dataset/test/Healthy'
            legacy.mkdir(parents=True)
            Image.new('RGB', (180, 180), 'red').save(legacy / 'removed_closeup.png')
            output, manifest = prepare_dataset(root, target=8)
            self.assertEqual(len(manifest['records']), 40)
            self.assertFalse(any('removed_closeup' in row['path'] for row in manifest['records']))
            self.assertEqual(manifest['counts']['test']['Healthy']['originals'], 2)
            self.assertEqual(prepare_dataset(root, target=8)[0], output)


if __name__ == '__main__':
    unittest.main()
