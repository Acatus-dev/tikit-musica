INSERT INTO `omeka_collections` (`id`, `public`, `featured`, `added`, `modified`, `owner_id`) VALUES
(1, 1, 0, NOW(), NOW(), 1),
(2, 1, 0, NOW(), NOW(), 1);

INSERT INTO `omeka_elements` (`id`, `element_set_id`, `order`, `name`, `description`, `comment`) VALUES
(92, 3, NULL, 'ID Author', '', ''),
(93, 3, NULL, 'Name Author', 'Name of the author', '');

INSERT INTO `omeka_element_texts` (`id`, `record_id`, `record_type`, `element_id`, `html`, `text`) VALUES
(1, 1, 'Collection', 50, 0, 'Authors'),
(2, 1, 'Collection', 49, 0, 'List of authors'),
(3, 2, 'Collection', 50, 0, 'Partitions'),
(4, 2, 'Collection', 49, 0, 'List of partitions'),
(5, 1, 'Item', 50, 0, 'First partition'),
(6, 1, 'Item', 41, 0, 'This is the first partition'),
(7, 1, 'Item', 92, 0, '1A'),
(8, 1, 'Item', 93, 0, 'First Author'),
(9, 2, 'Item', 50, 0, 'First Author'),
(10, 2, 'Item', 41, 0, 'First author in the database'),
(11, 2, 'Item', 31, 0, '1900'),
(12, 2, 'Item', 32, 0, 'Paris, France'),
(13, 2, 'Item', 33, 0, '2000'),
(14, 2, 'Item', 92, 0, '1A');

INSERT INTO `omeka_items` (`id`, `item_type_id`, `collection_id`, `featured`, `public`, `modified`, `added`, `owner_id`) VALUES
(1, 18, 2, 0, 1, '2016-05-25 14:37:32', '2016-05-25 14:37:32', 1),
(2, 12, 1, 0, 1, '2016-05-25 14:38:45', '2016-05-25 14:38:45', 1);

INSERT INTO `omeka_item_types` (`id`, `name`, `description`) VALUES
(18, 'Partition', 'Describe a partition');

INSERT INTO `omeka_item_types_elements` (`id`, `item_type_id`, `element_id`, `order`) VALUES
(48, 12, 92, 8),
(49, 18, 92, 3),
(50, 18, 93, 3);

INSERT INTO `omeka_files` (`id`, `item_id`, `order`, `size`, `has_derivative_image`, `authentication`, `mime_type`, `type_os`, `filename`, `original_filename`, `modified`, `added`, `stored`, `metadata`) VALUES
(2, 1, NULL, 1128306, 0, 'dc374bb9fe6b4dd289abbd8faed79095', 'application/xml', '0', '003137ee07d52914b89fd08f4ea34599.mei', 'Beethoven_op.18_1.mei', '2016-05-25 15:34:38', '2016-05-25 15:34:38', 1, '[]');

INSERT INTO `omeka_linktoitem` (`id`, `from_collection_id`, `from_item_type_id`, `from_title_elementset`, `from_title_element_id`, `from_elementset`, `from_element_id`, `to_collection_id`, `to_item_type_id`, `to_elementset`, `to_element_id`) VALUES
(1, 2, 18, 'Item Type Metadata', 93, 'Item Type Metadata', 92, 1, 12, 'Item Type Metadata', 92);
