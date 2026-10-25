// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './PaperPrimitives.jsx';
import { RivalAvatar } from './RivalDetails.jsx';

describe('桌边头像', () => {
  it('正式立绘角色使用立绘图片，不加头像专用类', () => {
    const { container } = render(<Avatar portrait="chen" name="陈主管" />);
    const image = container.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('alt', '陈主管的头像');
    expect(container.querySelector('.paper-avatar.has-generated-avatar')).not.toBeInTheDocument();
  });

  it('部门与公司同事使用专用头像，并标记头像专用类', () => {
    const { container } = render(<Avatar portrait="tang" name="唐采购" />);
    expect(container.querySelector('img')).toBeInTheDocument();
    expect(container.querySelector('.paper-avatar.has-generated-avatar')).toBeInTheDocument();
  });

  it('没有任何形象时退回通用图标，不渲染图片', () => {
    const { container } = render(<Avatar portrait={undefined} name="同事" />);
    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('对手头像优先本人形象，没有形象时才用职业图标占位', () => {
    const withArt = render(<RivalAvatar player={{ id: 'ye', name: '叶设计', portrait: 'ye', career: 'precision' }} />);
    expect(withArt.container.querySelector('img')).toBeInTheDocument();

    const withoutArt = render(<RivalAvatar player={{ id: 'colleague-6', name: '同事7', gender: 'male' }} />);
    expect(withoutArt.container.querySelector('img')).not.toBeInTheDocument();
    expect(withoutArt.container.querySelector('.career-avatar')).toBeInTheDocument();
  });
});
