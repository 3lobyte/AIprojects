from skimage import io
import matplotlib.pyplot as plt
import numpy as np 
from matplotlib import patheffects, patches
from tqdm import tqdm
import pandas as pd
import torch
import torchvision

# ssd utils

def generate_anchors(scales, centers, sizes):
    k, anchors, grid_size = [], [], []
    for s in scales:
        cnt = 0
        for (x, y) in centers:
            for (w, h) in sizes:
                for i in range(s):
                    for j in range(s):
                        # cwh
                        #anchors.append(np.array([x+i, y+j, w, h])/s)
                        # xyxy
                        anchors.append(np.array([x+i-w/2, y+j-h/2, x+i+w/2, y+j+h/2])/s)
                        grid_size.append(np.array([1./s,1./s]))
                        cnt = cnt + 1
        k.append(cnt)
    return k, torch.FloatTensor(anchors), torch.FloatTensor(grid_size)

def map_to_ground_truth(overlaps):
    prior_overlap, prior_idx = overlaps.max(1)
    gt_overlap, gt_idx = overlaps.max(0)
    gt_overlap[prior_idx] = 1.99
    for i,o in enumerate(prior_idx): gt_idx[o] = i
    return gt_overlap, gt_idx


def actn_to_bb(actn, anchors, grid_size):
    actn_bbs = torch.tanh(actn)
    actn_centers = anchors[:,:2] + actn_bbs[:,:2]/2*grid_size
    actn_hw = anchors[:,2:]*(actn_bbs[:,2:]/2+1) 
    return torch.cat([actn_centers, actn_hw], dim=1)

# image utils

def open_image(path):
    return io.imread(path)

def save_image(img, path):
    return io.imsave(path, img)

def show_image(img, figsize=None, ax=None):
    if not ax: fig, ax = plt.subplots(figsize=figsize)
    ax.imshow(img)
    ax.get_xaxis().set_visible(False)
    ax.get_yaxis().set_visible(False)
    return ax

def draw_rect(ax, b, edgecolor='white', lw=2):
    patch = ax.add_patch(patches.Rectangle(b[:2], *b[2:], fill=False, edgecolor=edgecolor, lw=lw))
    draw_outline(patch, 4)

def draw_outline(o, lw):
    o.set_path_effects([patheffects.Stroke(linewidth=lw, foreground='black'), patheffects.Normal()])
    
# bounding box utils

def ltlg2xywh(bb, mBB, shape):
    h, w = shape
    x, y = (mBB[2] - mBB[0])/w, (mBB[1] - mBB[3])/h
    
    # bb in format nw.lat, nw.lng, se.lat, se.lng) in latitude, longitude 
    return np.array([ 
            (bb[0] - mBB[0])/x,
            (mBB[1] - bb[1])/y,
            (bb[2] - mBB[0])/x - (bb[0] - mBB[0])/x,
            (mBB[1] - bb[3])/y - (mBB[1] - bb[1])/y
        ])

def bb_norm_xyxy(bb, sz):
    return np.array([bb[0]/sz[0], bb[1]/sz[1], (bb[0]+bb[2])/sz[0], (bb[1]+bb[3])/sz[1]])

def bb_unnorm_xywh(bb, sz):
    return np.array([bb[0]*sz[0], bb[1]*sz[1], (bb[2]-bb[0])*sz[0], (bb[3]-bb[1])*sz[1]])

def bb_unnorm(bb, sz):
    return np.array([bb[0]*sz[0], bb[1]*sz[1], bb[2]*sz[0], bb[3]*sz[1]])

def xyxy2xywh(bb):
    # from (x_min, y_min, x_max, y_max) to (x_min, y_min, width, height)
    return np.array([bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]])

def bb_unnorm_window_xyxy(bb, shape, ori_shape, i, j, szx, szy, window, stride):
    # bb unnorm with reference to window
    bb = bb_unnorm_xyxy(bb, shape)
    # translate
    if(i < szx - 1): 
        bb[0] += stride*i
        bb[2] += stride*i
    elif i == szx - 1: 
        bb[0] += ori_shape[1] - window
        bb[2] += ori_shape[1] - window
    if(j < szy - 1): 
        bb[1] += stride*j
        bb[3] += stride*j
    elif j == szy - 1: 
        bb[1] += ori_shape[0] - window
        bb[3] += ori_shape[0] - window
    return bb

def bb_unnorm_xyxy(bb, sz):
    return np.array([bb[0]*sz[1], bb[1]*sz[0], bb[2]*sz[1], bb[3]*sz[0]])

def xyxy2xywh(bb):
    # from (x_min, y_min, x_max, y_max) to (x_min, y_min, width, height)
    return np.array([bb[0],bb[1],bb[2]-bb[0],bb[3]-bb[1]])

def xywh2xyxy(bb):
    # from (x_min, y_min, x_max, y_max) to (x_min, y_min, width, height)
    return np.array([bb[0],bb[1],bb[0]+bb[2],bb[1]+bb[3]])

# patch utils

def keep_bbs(anns, x_max, x_min, y_max, y_min, perc=0.3):
    patch_bbs, patch_labels = [], []
    for bb, label in anns:
        # xywh
        # bb is inside
        if (bb[0]+bb[2]) <= x_max and bb[0] >= x_min and (bb[1]+bb[3]) <= y_max and bb[1] >= y_min:
            _bb = [bb[0]-x_min, bb[1]-y_min, bb[2], bb[3]]
            patch_bbs.append(_bb)
            patch_labels.append(label)
        # bb is partial
        elif (bb[0]+bb[2]) <= x_max and bb[0] < x_min and (bb[0]+bb[2]) > x_min and (bb[1]+bb[3]) <= y_max and bb[1] >= y_min:
            w = bb[0]+bb[2]-x_min
            if w >= perc*bb[2]:
                _bb = [0, bb[1]-y_min, w, bb[3]]
                patch_bbs.append(_bb)
            patch_labels.append(label)
        elif (bb[0]+bb[2]) <= x_max and bb[0] < x_min and (bb[0]+bb[2]) > x_min and (bb[1]+bb[3]) <= y_max and bb[1] < y_min and (bb[1]+bb[3]) > y_min:
            w, h = bb[0]+bb[2]-x_min, bb[1]+bb[3]-y_min
            if w >= perc*bb[2] and h > perc*bb[3]:
                _bb = [0, 0, w, h]
                patch_bbs.append(_bb)
                patch_labels.append(label)
        elif (bb[0]+bb[2]) <= x_max and bb[0] < x_min and (bb[0]+bb[2]) > x_min and (bb[1]+bb[3]) > y_max and bb[1] >= y_min and bb[1] < y_max:
            w, h = bb[0]+bb[2]-x_min, y_max-bb[1]
            if w >= perc*bb[2] and h > perc*bb[3]:
                _bb = [0, bb[1]-y_min, w, h]
                patch_bbs.append(_bb)
                patch_labels.append(label)
        elif (bb[0]+bb[2]) > x_max and bb[0] >= x_min and bb[0] < x_max and (bb[1]+bb[3]) <= y_max and bb[1] >= y_min:
            w = x_max-bb[0]
            if w >= perc*bb[2]:
                _bb = [bb[0]-x_min, bb[1]-y_min, w, bb[3]]
                patch_bbs.append(_bb)
                patch_labels.append(label)
        elif (bb[0]+bb[2]) > x_max and bb[0] >= x_min and bb[0] < x_max and (bb[1]+bb[3]) <= y_max and bb[1] < y_min and (bb[1]+bb[3]) > y_min:
            w, h = x_max-bb[0], bb[1]+bb[3]-y_min
            if w >= perc*bb[2] and h > perc*bb[3]:
                _bb = [bb[0]-x_min,0, w,  h]
                patch_bbs.append(_bb)
                patch_labels.append(label)   
        elif (bb[0]+bb[2]) > x_max and bb[0] >= x_min and bb[0] < x_max and (bb[1]+bb[3]) > y_max and bb[1] >= y_min and bb[1] < y_max:
            w, h = x_max-bb[0],  y_max-bb[1]
            if w >= perc*bb[2] and h > perc*bb[3]:
                _bb = [bb[0]-x_min, bb[1]-y_min, w, h]
                patch_bbs.append(_bb)
                patch_labels.append(label)   
        elif (bb[0]+bb[2]) <= x_max and bb[0] >= x_min and (bb[1]+bb[3]) <= y_max and bb[1] < y_min and (bb[1]+bb[3]) > y_min:
            h = bb[1]+bb[3]-y_min
            if h > perc*bb[3]:
                _bb = [bb[0]-x_min, 0, bb[2], h]
                patch_bbs.append(_bb)
                patch_labels.append(label)
        elif (bb[0]+bb[2]) <= x_max and bb[0] >= x_min and (bb[1]+bb[3]) > y_max and bb[1] >= y_min and bb[1] < y_max:
            h = y_max-bb[1]
            if h > perc*bb[3]:
                _bb = [bb[0]-x_min, bb[1]-y_min, bb[2], h]
                patch_bbs.append(_bb)
                patch_labels.append(label)
    return patch_bbs, patch_labels

def build_patches(df, PATH, patches_folder, window, stride, perc=0.3):
    imgs_ori = df.img_name.values
    anns_ori = df.annotations.values 
    patches, annotations, mosaics = [], [], []
    cnt = 0
    for img_name, anns in tqdm(zip(imgs_ori, anns_ori), total=len(imgs_ori)):
        img = open_image('{}/{}'.format(PATH, img_name))
        h, w = img.shape[0], img.shape[1] 
        # sliding window
        patch_names, patch_anns = [], []
        mosaic = ""
        j = 0
        end = False
        while not end:
            y_max, y_min = window + stride*j, stride*j
            if y_max > h:
                if y_min < h:
                    y_max, y_min = h, h - window
                end = True                 
            patch_names_mosaic = []
            end2, i = False, 0
            while not end2:
                x_max, x_min = window + stride*i, stride*i
                if x_max > w:
                    if x_min < w:
                        x_max, x_min = w, w - window
                    end2 = True   
                #print(h, w, j, y_min, y_max, i, x_min, x_max)
                
                # save patch
                patch = img[y_min:y_max, x_min:x_max,:]
                patch_name = '{}_{}_{}{}'.format(img_name[:-4], i, j, img_name[-4:])
                save_image(patch, '{}/{}'.format(patches_folder,patch_name))
                patch_names.append(patch_name)
                #print("\t Saving {} in {}".format(patch_name, dest))

                # keep anns inside patch
                patch_bb, patch_label = [], []
                patch_bb, patch_label = keep_bbs(anns, x_max, x_min, y_max, y_min, perc)
                patch_anns.append([(pbb, plab) for pbb, plab in zip(patch_bb, patch_label)])


                patch_names_mosaic.append(patch_name)
                mosaic += str(cnt) + " "
                cnt += 1
                i = i + 1
            mosaic += ","

            j = j + 1
        
        mosaics.append(mosaic)
        patches += patch_names
        annotations += patch_anns
        
    # save results
    dfa = pd.DataFrame({'img_name': patches, 'annotations': [anns_int2str(ann) for ann in annotations]})    
    dfm = pd.DataFrame({'img_name': imgs_ori, 'mosaic': mosaics, 'annotations': [anns_int2str(ann) for ann in anns_ori]})
    
    return dfa, dfm   

# annotations utils

def anns_int2str(annotations):
    '''
        Convert list of tuples (bb, label) to string.
    '''
    anns = ''
    for bb, label in annotations:
        anns += str(int(bb[0])) + ' ' + str(int(bb[1])) + ' ' + str(int(bb[2])) + ' ' + str(int(bb[3])) + ' ' + str(int(label)) + ' '
    return anns

def anns_str2int(annotations):
    '''
        Reads annotations in string and convert to list of tuples.
    '''
    bboxes = []
    for anns in annotations:
        dets = []
        if isinstance(anns, str):
            anns = anns.split()
            sz = len(anns) // 5
            for i in range(sz):
                dets.append(([int(anns[5*i]),int(anns[5*i+1]),int(anns[5*i+2]),int(anns[5*i+3])], int(anns[5*i+4])))
        bboxes.append(dets)
    return bboxes

# F1 metric

def F1(pred_bb, pred_c, tar_bb, tar_c, threshold=0.5):
    
    tp, fp, fn = 0, 0, 0    
        
    # if there are detections
    if len(pred_bb) > 0:
        # nms
        nms_ixs = torchvision.ops.nms(pred_bb, pred_c.float(), threshold)
        pred_bb, pred_c = pred_bb[nms_ixs], pred_c[nms_ixs]
        # iou
        if len(tar_bb) > 0:
            overlaps = torchvision.ops.box_iou(pred_bb, tar_bb.to(pred_bb.device)).transpose(1,0)
            ixs = []
            tar_c = tar_c.long().to(pred_c.device)
            # for each gt
            for i, o in enumerate(overlaps):
                # number of detections
                dets = (o > 0.5).nonzero()
                if dets.shape[0] > 0:
                    dets = dets[:,0]
                    det = False
                    for ix in dets:
                        if det: break
                        if not ix in ixs:
                            if pred_c[ix] == tar_c[i]: 
                                tp += 1
                                ixs.append(ix)
                                det = True
                    # no matches
                    if not det: fn += 1
                # no detection
                else:
                    fn += 1
            # bbs that did not match any gt
            fp += pred_bb.shape[0] - len(ixs)
        else: 
            # all detections are false positive
            fp += len(pred_bb)
    else:
        # all gt are false negative
        fn += len(tar_bb)
    
    if tp == (tp + fp): precision = 1
    else: precision = tp / (tp + fp)
    
    if tp == (tp + fn): recall = 1
    else: recall = tp / (tp + fn)
        
    #print(tp, fp, fn)
        
    return 2.*(precision*recall)/(precision + recall + 1e-8)